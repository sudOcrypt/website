import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SQUARE_ACCESS_TOKEN = Deno.env.get("SQUARE_ACCESS_TOKEN") || "";

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
  console.log('🔷 sync-square invoked, method:', req.method);
  
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

      const productData = {
        square_catalog_object_id: item.id,
        square_variation_id: primaryVariation.id,
        title: itemData.name || "Unnamed Product",
        description: itemData.description || "",
        image_url: imageUrl,
        price: priceInDollars,
        category: category,
        is_active: !itemData.is_deleted && itemData.available_online !== false,
        stock: 999, // Square doesn't track stock the same way, manage in your DB
        sort_order: 0,
      };

      console.log('🔄 Processing:', productData.title);

      const { data: existing } = await supabaseService
        .from("products")
        .select("id")
        .eq("square_catalog_object_id", item.id)
        .maybeSingle();

      if (existing) {
        // When updating, only update image_url if we got a new one from Square
        // This preserves manually added images
        const updateData = imageUrl 
          ? productData 
          : { ...productData, image_url: undefined }; // undefined = don't update this field
        
        await supabaseService
          .from("products")
          .update(updateData)
          .eq("square_catalog_object_id", item.id);
        updated++;
        console.log('  ✅ Updated');
      } else {
        await supabaseService.from("products").insert(productData);
        created++;
        console.log('  ✅ Created');
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
