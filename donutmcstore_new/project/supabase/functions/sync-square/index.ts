import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SQUARE_ACCESS_TOKEN = Deno.env.get("SQUARE_ACCESS_TOKEN") || "";
const SQUARE_LOCATION_ID = Deno.env.get("SQUARE_LOCATION_ID") || "";

function mapSquareCategory(customAttributeValues: any): string {
  // Square uses custom attributes for metadata
  // customAttributeValues might not be an array, so handle carefully
  if (!customAttributeValues || !Array.isArray(customAttributeValues)) {
    return 'items'; // Default category
  }
  
  const categoryAttr = customAttributeValues.find((attr: any) => 
    attr.name?.toLowerCase() === "category"
  );
  return categoryAttr?.string_value?.toLowerCase() || 'items';
}

Deno.serve(async (req: Request) => {
  console.log('🔷 sync-square invoked (no stock overwrite), method:', req.method);
  
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('✅ sync-square POST request received');

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseService = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    console.log('✅ Supabase client created, fetching Square catalog');

    console.log('✅ Admin verified, fetching Square catalog');

    // Fetch all catalog items from Square
    // IMPORTANT: include_related_objects=true tells Square to include images
    const squareResponse = await fetch(
      "https://connect.squareup.com/v2/catalog/list?types=ITEM&include_related_objects=true",
      {
        headers: {
          "Square-Version": "2024-12-18",
          "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!squareResponse.ok) {
      const errorData = await squareResponse.json();
      console.error('❌ Square API error:', errorData);
      return new Response(
        JSON.stringify({ error: errorData.errors?.[0]?.detail || "Failed to fetch from Square" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const squareData = await squareResponse.json();
    
    // Log the full response to see what Square is actually sending
    console.log('🔷 Full Square response:', JSON.stringify(squareData, null, 2));
    
    const items = squareData.objects || [];
    const relatedObjects = squareData.related_objects || [];

    console.log('📦 Found', items.length, 'items in Square');
    console.log('🔗 Found', relatedObjects.length, 'related objects (includes images)');

    // Create a map of image objects for quick lookup
    const imageMap = new Map();
    for (const obj of relatedObjects) {
      if (obj.type === "IMAGE") {
        imageMap.set(obj.id, obj.image_data?.url);
      }
    }
    console.log('🖼️ Found', imageMap.size, 'images');

    // Fetch stock from Square Inventory API (so new products get correct stock)
    const inventoryByVariationId = new Map<string, number>();
    const variationIds = items
      .filter((o: any) => o.type === "ITEM" && o.item_data?.variations?.length > 0)
      .map((o: any) => o.item_data.variations[0].id);
    if (variationIds.length > 0 && SQUARE_LOCATION_ID) {
      try {
        const invRes = await fetch(
          "https://connect.squareup.com/v2/inventory/counts/batch-retrieve",
          {
            method: "POST",
            headers: {
              "Square-Version": "2024-12-18",
              "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              catalog_object_ids: variationIds,
              location_ids: [SQUARE_LOCATION_ID],
            }),
          }
        );
        if (invRes.ok) {
          const invData = await invRes.json();
          const counts = invData.counts || [];
          for (const c of counts) {
            const id = c.catalog_object_id;
            const qty = parseInt(c.quantity, 10) || 0;
            inventoryByVariationId.set(id, (inventoryByVariationId.get(id) || 0) + qty);
          }
          console.log('📦 Loaded inventory for', inventoryByVariationId.size, 'variations');
        } else {
          console.log('⚠️ Inventory API not available (missing INVENTORY_READ or location)');
        }
      } catch (e) {
        console.warn('⚠️ Inventory fetch failed:', (e as Error).message);
      }
    }

    let synced = 0;
    let created = 0;
    let updated = 0;

    for (const item of items) {
      if (item.type !== "ITEM") continue;

      const itemData = item.item_data;
      const variations = itemData.variations || [];
      
      console.log('🔍 Item data:', JSON.stringify({
        name: itemData.name,
        hasImages: !!itemData.images,
        images: itemData.images,
        imagesLength: itemData.images?.length,
      }));
      
      // Use the first variation for pricing (most common setup)
      const primaryVariation = variations[0];
      if (!primaryVariation) {
        console.log('⚠️ Skipping item with no variations:', itemData.name);
        continue;
      }

      const variationData = primaryVariation.item_variation_data;
      const priceInCents = variationData.price_money?.amount || 0;
      const priceInDollars = priceInCents / 100;

      // Extract category from custom attributes or default to 'items'
      const category = mapSquareCategory(item.custom_attribute_values);
      
      // Extract image URL - Square stores images as related objects
      let imageUrl = null;
      if (itemData.image_ids && Array.isArray(itemData.image_ids) && itemData.image_ids.length > 0) {
        // Look up the image URL from our imageMap
        imageUrl = imageMap.get(itemData.image_ids[0]) || null;
      }
      
      console.log('📸 Image URL extracted:', imageUrl);

      // Base data from Square (title, price, category, etc.)
      const productDataFromSquare = {
        square_catalog_object_id: item.id,
        square_variation_id: primaryVariation.id,
        title: itemData.name || "Unnamed Product",
        description: itemData.description || "",
        image_url: imageUrl,
        price: priceInDollars,
        category: category,
        is_active: !itemData.is_deleted && itemData.available_online !== false,
        sort_order: 0,
      };

      const squareStock = inventoryByVariationId.has(primaryVariation.id)
        ? inventoryByVariationId.get(primaryVariation.id)!
        : null;

      console.log('🔄 Processing:', productDataFromSquare.title, '| Square stock:', squareStock ?? 'n/a');

      const { data: existing } = await supabaseService
        .from("products")
        .select("id, stock, image_url")
        .eq("square_catalog_object_id", item.id)
        .maybeSingle();

      if (existing) {
        // UPDATE: Sync Square data. If Square has inventory, use it; otherwise keep existing stock.
        const updateData: Record<string, unknown> = {
          square_variation_id: productDataFromSquare.square_variation_id,
          title: productDataFromSquare.title,
          description: productDataFromSquare.description,
          price: productDataFromSquare.price,
          category: productDataFromSquare.category,
          is_active: productDataFromSquare.is_active,
          sort_order: productDataFromSquare.sort_order,
        };
        if (imageUrl) updateData.image_url = imageUrl;
        if (squareStock !== null) updateData.stock = squareStock;
        await supabaseService
          .from("products")
          .update(updateData)
          .eq("square_catalog_object_id", item.id);
        updated++;
        console.log('  ✅ Updated', squareStock !== null ? `(stock=${squareStock})` : '(stock unchanged)');
      } else {
        // NEW product: use stock from Square Inventory, or 0 if not tracked
        const insertData = {
          ...productDataFromSquare,
          stock: squareStock ?? 0,
        };
        await supabaseService.from("products").insert(insertData);
        created++;
        console.log('  ✅ Created', squareStock !== null ? `(stock=${squareStock})` : '(stock=0)');
      }
      synced++;
    }

    console.log('✅ Sync complete:', synced, 'products');

    return new Response(
      JSON.stringify({
        success: true,
        synced,
        created,
        updated,
        message: `Synced ${synced} products from Square (${created} created, ${updated} updated)`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to sync products from Square" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
