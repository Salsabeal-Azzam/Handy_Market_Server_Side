const Product = require('../Models/Product.model');

// get All Products [approve: true and softDelete: false]
let getAllProduct = (req, res)=>{

    Product.find({soft_delete: false, product_approval: true}).exec((err, data)=>{
        if(err){
            res.status(400).json({message: 'Catch Error : ' + err.mesage})
        }
        else{
            res.status(200).json(data)
        }
    })

}

// get All Products Approval Or Not That Created By Seller {approval}
let getProductsApprovalOrNotCreatedby = async (req, res)=>{
    try{
        // Check approval
        let approval = req.params['approval'] == 'true'? true:false;

        let products = await Product.find({created_by: req.params['id'], product_approval: approval});

        res.status(200).json({products});

       

    }
    catch(err){
        res.status(400).json({message: 'Catch Error : ' + err})
    }
}

// Add Product
let addProduct = (req, res)=>{

    const newProduct= new Product({...req.body})
    newProduct.save()
    .then((data)=>{
        res.status(201).json({message: 'Add Product Success', data})
    })
    .catch((err)=>{
        res.status(400).json({message: 'Catch Erro : ' + err})
    })

}

// Get Product By ID
let getProductByID = async(req, res)=>{
    try{
        let product = await Product.findOne({_id: req.params['id'], soft_delete: false, product_approval: true});
        if(product){
            res.status(200).json({product})
        }
        else{
            res.status(400).json({message: 'May Wrong in Product ID or This Product Not Exist Or Prudct Not Approval'})
        }
    }
    catch(err){
        res.status(400).json({message: 'Catch Error : ' + err.message})
    }
    
}

// Update Product By Seller Send Created_by id With body object.
let updateProduct = async(req, res)=>{
    try{

        if(req.body.product_name){
            let product = await Product.findById(req.params['productId']);
            
            if (product.product_name == req.body.product_name){
                let product = await Product.findOneAndUpdate(req.params['productId'], {...req.body}, {new:true});
                if(product){
                    res.status(200).json({product})
                }
                else{
                    res.status(400).json({message: 'May Wrong in Product ID or This Product Not Exist'})
                }
            }
            // Logic
            else{
                let allProducts = await Product.find({created_by: req.params['sellerId']});
                
                let flag = allProducts.find((product)=>{
                    return product.product_name == req.body.product_name;
                })

                if (flag){
                    res.status(400).json({message: 'This Product name is Already exist'})
                }
                else{

                    let product = await Product.findOneAndUpdate(req.params['productId'], {...req.body}, {new:true});
                    if(product){
                        res.status(200).json({product})
                    }
                    else{
                        res.status(400).json({message: 'May Wrong in Product ID or This Product Not Exist'})
                    }

                }

            }
        }
        else{
            let product = await Product.findOneAndUpdate(req.params['productId'], {...req.body}, {new:true});
            if(product){
                res.status(200).json({product})
            }
            else{
                res.status(400).json({message: 'May Wrong in Product ID or This Product Not Exist'})
            }
        }

    }
    catch(err){
        res.status(400).json({message: 'Catch Error : ' + err.message})
    }

}

// For Admin to approval product
let updateApproveProduct = async(req, res)=>{
    try{
        // Check First if Product Is Not Deleted
        let product = await Product.findById(req.params['id'])
        if(product.soft_delete == true){
            res.status(400).json({message: 'can not Approve Deleted Product..'})
        }else{
        
            let productApproval = await Product.findByIdAndUpdate(req.params['id'], {product_approval: true}, {new: true});
            
            if(productApproval){
                res.status(200).json({message: 'This Product Is Approval.', productApproval});
            }else{
                res.status(400).json({message: 'May Wrong in Product ID or This Product Not Exist'})
            }
        }
    }
    catch(err){
        res.status(400).json({message: 'Catch Error : ' + err.message})
    }

}

//delete Product By Both Admin Or Seller Handel By Middleware
let deleteProduct = async(req, res)=>{
    try{
        let productDeleted = await Product.findByIdAndUpdate(req.params['productId'], {soft_delete: true}, {new: true});
        if(productDeleted){
            res.status(200).json({message: 'This Product Is Deleted Successfuly.'});
        }else{
            res.status(400).json({message: 'May Wrong in Product ID or This Product Not Exist'})
        }
    }
    catch(err){
        res.status(400).json({message: 'Catch Error : ' + err.message})
    }
}

// For Admin To get All Products That not Approval
let getAllProductNotApproval = async(req, res)=>{
    try{
        let products = await Product.find({created_by: req.params['id'], product_approval: false});
        res.status(200).json({products});
    }
    catch(err){
        res.status(400).json({message: 'Catch Error : ' + err})
    }
}



module.exports = {
    getAllProduct,
    addProduct,
    getProductsApprovalOrNotCreatedby,
    updateProduct,
    getProductByID,
    updateApproveProduct,
    deleteProduct,
    getAllProductNotApproval

}

