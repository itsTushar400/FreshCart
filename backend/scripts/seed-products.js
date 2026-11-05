require("dotenv").config();
const pool = require("../src/config/db");

const products = [
  [1,"Fresh Tomato","Fruits & Vegetables","1 kg",24,30,20,"/images/fresh-tomato.jpg","deal"],
  [2,"Potato","Fruits & Vegetables","1 kg",28,34,18,"/images/potato.jpg","deal"],
  [3,"Onion","Fruits & Vegetables","1 kg",26,34,23,"/images/onion.jpg","deal"],
  [4,"Banana","Fruits & Vegetables","1 dozen",50,60,16,"/images/banana.jpg","new"],
  [5,"Fresh Apples","Fruits & Vegetables","1 kg",120,150,20,"/images/fresh-apples.jpg","bestseller"],
  [6,"Amul Taaza Milk","Dairy & Breakfast","1 L",56,62,10,"/images/milk.jpg","bestseller"],
  [7,"Fresh Curd","Dairy & Breakfast","400 g",35,40,12,"/images/curd.jpg","deal"],
  [8,"Butter","Dairy & Breakfast","100 g",58,65,11,"/images/butter.jpg","bestseller"],
  [9,"Cheese Slices","Dairy & Breakfast","200 g",110,125,12,"/images/cheese-slices.jpg","new"],
  [10,"Brown Bread","Dairy & Breakfast","400 g",45,50,10,"/images/brown-bread.jpg","deal"],
  [11,"Aashirvaad Atta","Atta, Rice & Dal","5 kg",245,279,12,"/images/atta.jpg","bestseller"],
  [12,"Basmati Rice","Atta, Rice & Dal","1 kg",95,120,21,"/images/basmati-rice.jpg","deal"],
  [13,"Toor Dal","Atta, Rice & Dal","1 kg",135,155,13,"/images/toor-dal.jpg","new"],
  [14,"Moong Dal","Atta, Rice & Dal","1 kg",110,130,15,"/images/moong-dal.jpg","deal"],
  [15,"Chana Dal","Atta, Rice & Dal","1 kg",85,100,15,"/images/chana-dal.jpg","bestseller"],
  [16,"Sunflower Oil","Oil, Ghee & Masala","1 L",134,158,15,"/images/sunflower-oil.jpg","deal"],
  [17,"Pure Desi Ghee","Oil, Ghee & Masala","500 ml",290,330,12,"/images/desi-ghee.jpg","bestseller"],
  [18,"Turmeric Powder","Oil, Ghee & Masala","200 g",48,55,13,"/images/turmeric.jpg","new"],
  [19,"Red Chilli Powder","Oil, Ghee & Masala","200 g",65,75,13,"/images/red-chilli.jpg","deal"],
  [20,"Garam Masala","Oil, Ghee & Masala","100 g",70,80,12,"/images/garam-masala.jpg","bestseller"],
  [21,"Lay's Classic","Snacks & Beverages","52 g",20,25,20,"/images/potato-wafers.jpg","new"],
  [22,"Chocolate Cookies","Snacks & Beverages","200 g",60,75,20,"/images/chocolate-cookies.jpg","deal"],
  [23,"Orange Juice","Snacks & Beverages","1 L",95,110,13,"/images/orange-juice.jpg","bestseller"],
  [24,"Mixed Nuts","Snacks & Beverages","200 g",180,210,14,"/images/mixed-nuts.jpg","new"],
  [25,"Potato Wafers","Snacks & Beverages","100 g",35,40,12,"/images/potato-wafers.jpg","deal"],
  [26,"Face Wash","Personal Care","100 ml",99,129,23,"/images/face-wash.jpg","deal"],
  [27,"Shampoo","Personal Care","180 ml",149,175,15,"/images/shampoo.jpg","bestseller"],
  [28,"Bath Soap","Personal Care","Pack of 4",110,125,12,"/images/bath-soap.jpg","new"],
  [29,"Toothpaste","Personal Care","150 g",85,100,15,"/images/toothpaste.jpg","deal"],
  [30,"Body Lotion","Personal Care","200 ml",175,210,17,"/images/body-lotion.jpg","bestseller"],
  [31,"Dishwash Liquid","Home Care","500 ml",99,120,17,"/images/dishwash-liquid.jpg","deal"],
  [32,"Laundry Detergent","Home Care","1 kg",115,135,15,"/images/laundry-detergent.jpg","bestseller"],
  [33,"Floor Cleaner","Home Care","1 L",120,145,17,"/images/floor-cleaner.jpg","new"],
  [34,"Toilet Cleaner","Home Care","500 ml",85,100,15,"/images/toilet-cleaner.jpg","deal"],
  [35,"Cleaning Sponges","Home Care","Pack of 3",45,55,18,"/images/cleaning-sponges.jpg","bestseller"],
  [36,"Baby Diapers","Baby Care","Pack of 10",199,230,13,"/images/baby-diapers.jpg","deal"],
  [37,"Baby Wipes","Baby Care","Pack of 72",99,115,14,"/images/baby-wipes.jpg","new"],
  [38,"Baby Shampoo","Baby Care","200 ml",145,170,15,"/images/baby-shampoo.jpg","bestseller"],
  [39,"Baby Lotion","Baby Care","200 ml",160,185,14,"/images/baby-lotion.jpg","deal"],
  [40,"Baby Powder","Baby Care","200 g",110,130,15,"/images/baby-powder.jpg","new"],
  [41,"Instant Noodles","Packaged Food","Pack of 4",56,64,12,"/images/instant-noodles.jpg","deal"],
  [42,"Breakfast Cereal","Packaged Food","500 g",180,210,14,"/images/breakfast-cereal.jpg","bestseller"],
  [43,"Peanut Butter","Packaged Food","340 g",160,190,15,"/images/peanut-butter.jpg","new"],
  [44,"Tomato Ketchup","Packaged Food","500 g",95,110,13,"/images/tomato-ketchup.jpg","deal"],
  [45,"Pasta","Packaged Food","500 g",75,90,16,"/images/pasta.jpg","bestseller"],
  [46,"Dog Food","Pet Care","1 kg",220,260,15,"/images/dog-food.jpg","deal"],
  [47,"Cat Food","Pet Care","1 kg",240,280,14,"/images/cat-food.jpg","bestseller"],
  [48,"Pet Shampoo","Pet Care","200 ml",180,210,14,"/images/pet-shampoo.jpg","new"],
  [49,"Dog Treats","Pet Care","200 g",130,155,16,"/images/dog-treats.jpg","deal"],
  [50,"Pet Feeding Bowl","Pet Care","1 piece",150,180,17,"/images/pet-feeding-bowl.jpg","bestseller"],
  [51,"Daily Grocery Combo","Combo Packs","5 items",299,399,25,"/images/daily-grocery-combo.jpg","deal"],
  [52,"Breakfast Combo","Combo Packs","4 items",249,299,17,"/images/breakfast-combo.jpg","bestseller"],
  [53,"Snacks Party Combo","Combo Packs","6 items",199,249,20,"/images/snacks-party-combo.jpg","new"],
  [54,"Personal Care Combo","Combo Packs","4 items",349,449,22,"/images/personal-care-combo.jpg","deal"],
  [55,"Family Essentials Combo","Combo Packs","7 items",499,599,17,"/images/family-essentials-combo.jpg","bestseller"]
];

async function main() {
  try {
    for (const p of products) {
      await pool.query(
        `INSERT INTO products (id,name,category,weight,price,old_price,discount,image,type)
         VALUES (?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE name=VALUES(name),category=VALUES(category),weight=VALUES(weight),
         price=VALUES(price),old_price=VALUES(old_price),discount=VALUES(discount),image=VALUES(image),type=VALUES(type)`,
        p
      );
    }
    console.log(`Seeded ${products.length} products. Put matching images in public/images on the frontend.`);
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
main();
