const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

RideStylerShowcase.registerPlugin("WooCommerce", function (showcaseInstance, pluginProviderInstance, showcaseState, uiLibrary, options){
    let errors = [],
    wooApi = new WooCommerceRestApi({ url: options.url, consumerKey: options.consumerKey, consumerSecret: options.consumerSecret,  version: "wc/v3" });

    //This will create the "Build Wheel and Tire Package" button in the showcase
    function registerAction(){ 
        let settings = { isVisible: true, isDisabled: true},
        tireAction = pluginProviderInstance.registerShowcaseAction("global", "Cart", refineProducts, settings);

        showcaseInstance.app.$store.watch(function(state, getters) {
            return getters.userHasProductSelections;
        }, function (hasProduct) {
            tireAction.isDisabled = !hasProduct;
        });
    }
    
    // Refine showcase selected products
    function refineProducts(){ 
        showcaseInstance.app.$store.dispatch('refineUserSelectedProducts').then(function(userRefinedWheels){
            verifyProducts(userRefinedWheels);
        });
    }

    // Verify fitments in the showcase, find in woocommerce, get cart
    function verifyProducts(showcaseProducts){ 
        let rideStylerProducts = [],
        successMessage = "Your items have been added to the cart.";

        showcaseInstance.app.$store.dispatch('orderdetails/showModal', {
            data: showcaseProducts
        }).then(function(verifiedProducts){

            for(const product in verifiedProducts){
                rideStylerProducts.push(verifiedProducts[product]);
            }

            Promise.all(rideStylerProducts.map(x => getProductBySku(x))).then(function(wooProducts){
                if(wooProducts[0] !== undefined && errors.length == 0){
                    wooProducts.forEach(function(product){
                        addProductToCart(product)
                    });

                    if(errors.length == 0){
                        uiLibrary.showPrompt(successMessage, goToCart, "Checkout");
                    } else {
                        showErrors();
                    }
                } else {
                    showErrors();
                }
            });
        });
    }
    
    // retrieve product from woocommerce given the sku of that product
    async function getProductBySku(product){ 
        let returnProduct,
        productSku,
        productQuantity = product.Quantity;

        if(product.type === 'wheel'){
            productSku = product.PartNumber;
        } else {
            productSku = product.TireFitmentPartNumber;
        }

        await wooApi.get("products", { per_page: 20, sku: productSku }).then((response) => {
            if(response.data.length > 0){
                returnProduct = response.data[0];
                returnProduct.quantity = productQuantity;
            } else {
                errors.push("Sorry, we could not find your " + product.type + " in our inventory. \n");
            }
        }).catch((error) => {
            // Invalid request, for 4xx and 5xx statuses
        }).finally(() => {
            // Always executed.        
        });

        if(returnProduct !== undefined){
            return returnProduct;
        }
    };

    // Add product to woocommerce cart, given the product object
    function addProductToCart(product){ 
        let request = new XMLHttpRequest(),
        urlPath = options.url + "?wc-ajax=add_to_cart",
        data = new FormData();

        if(product !== undefined){
            data.append('product_sku', product.sku);
            data.append('product_id', product.id);
            data.append('quantity', product.quantity);
    
            request.open("POST", urlPath, false);
            request.send(data);
            request.onreadystatechange = function() {
                if(request.readyState === 4 && request.status === 200) {
                    JSON.parse(request.response);
                } else {
                    errors.push("There was an issue adding " + product.name + " to your cart. \n");
                }
            };
        }
    }

    // Redirect to shopify cart
    function goToCart(){ 
        window.location.href = options.url + "/cart";
    }

    // Calls UiLibrary do display any errors that occur throughout any of the processes
    function showErrors(){ 
        let errorMessage,
        displayMessage;

        for(let i=0;i<errors.length;i++){
            if(errorMessage !== undefined){
                errorMessage += (errors[i] + "\n");
            } else {
                errorMessage = errors[i];
            }
        };
        
        displayMessage = errorMessage.replace(/\n/g, "<br />");
        uiLibrary.showMessage(displayMessage);
        errors = [];
    }

    registerAction();
});
