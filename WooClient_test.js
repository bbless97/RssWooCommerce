    /*
    * WooClient recieves a list of products, woocom url, key, secret and a list of products wanted from the shop.
    * In return the productsWanted will be found in the woo shop and added to the cart, the WooClient then returns the 
    * cart's url to navigate to.
    */
    async function WooClient(clientUrl, clientKey, clientSecret, productsWanted){
        const self = this;
        let cartProducts;
        const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
        const axios = require('axios');
        const axiosInstance = axios.create({
            baseURL: clientUrl,
            timeout: 15000
        });
        const api = new WooCommerceRestApi({ 
            url: clientUrl, 
            consumerKey: clientKey, 
            consumerSecret: clientSecret, 
            version: "wc/v3"
        });

        async function getAllProducts(){ // retrieve all woocommerce products
            let returnProducts;
            // { per_page: 20, sku: productSku }
            await api.get("products", {sku: productsWanted[0]}).then((response) => {
                returnProducts = response.data;
            }).catch((error) => {
                // Invalid request, for 4xx and 5xx statuses
            }).finally(() => {
                // Always executed.        
            });

            return returnProducts;
        };
        
        async function getProductBySku(productSku){ // retrieve product given the sku of that product
            let returnProduct;

            await api.get("products", { per_page: 20, sku: productSku }).then((response) => {
                returnProduct = response.data[0];
                // console.log(response.headers)

            }).catch((error) => {
                // Invalid request, for 4xx and 5xx statuses
            }).finally(() => {
                // Always executed.        
            });

            return returnProduct;
        };

        async function addProductToCart(product){ // add product to cart, given the product object
            let responseData;
            let permalink = product.permalink.replace(clientUrl, ""); /// use this to add to cart just use POST instead
            let options = {
                "quantity": 4,
                "add-to-cart": product.parent_id,
                "product_id": product.parent_id,
                "variation_id": product.id
            };

            await axiosInstance.post(permalink, options).then((response) => {            
                responseData = response;
                console.log(response)

            }).catch((error) => {
                responseData = error.response;
            })

            return responseData;
        }

        await Promise.all(productsWanted.map(x => getProductBySku(x))).then(async function(products){
            await Promise.all(products.map(x => addProductToCart(x))).then(function(cart){
                // cartProducts = cart;
                // console.log(cart)
            });
        });

        // cartProducts = await getAllProducts();

        // console.log(cartProducts);

        // return cartProducts;
    }

    WooClient("https://msawheels.wheelproshosting.com/", "ck_dea8becb4312ead8b5f684795e150047b2d7b672", "cs_0ec5a2a453d366c7e7a03714665ea1a8053926d6", ["M12-00737"]);