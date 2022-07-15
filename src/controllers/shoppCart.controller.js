'use strict'

const ShoppingCart = require('../models/shoppCart.model');
const Tour = require('../models/tour.model');
const validate = require('../utils/validate');

exports.testShoppingCart = (req, res)=>{
    return res.send({message: 'Function testShoppingCart is running'});
}

exports.addToShoppingCart = async(req, res)=>{
    try{

        const userId = req.user.sub;
        const params = req.body;
        const data = {
            tour: params.tour,
            quantity: params.quantity
        };
        const msg = validate.validateData(data);
        if(msg) return res.status(400).send(msg);
        const shoppingCartExist = await ShoppingCart.findOne({user: userId});
        const tourExist = await Tour.findOne({_id: params.tour});
        if(!tourExist) return res.send({message: 'Tour not found'});
        if(!shoppingCartExist){
            if(params.quantity > tourExist.stockTicket) return res.send({message: 'Stock Tour not available'});
            const data = {
                user: req.user.sub
            }
            const tour = {
                tour: params.tour,
                quantity: params.quantity,
                subTotal: tourExist.priceTicket * params.quantity
            }
            data.tours = tour;
            data.quantityTours = 1;
            data.total = tour.subTotal;

            const stockTour = (tourExist.stockTicket - tour.quantity)         
            await Tour.findOneAndUpdate({_id: data.tour}, {stockTicket: stockTour }, {new: true});
        
           
            const shoppingCart = new ShoppingCart(data);
            await shoppingCart.save();
            return res.send({message: 'Tour add successfully', shoppingCart});
        }else{
            //actualizar el carrito
            if(params.quantity > tourExist.stockTicket) return res.send({message: 'Stock Tour not available'})
            for(let tour of shoppingCartExist.tours){
                console.log(tour);
                if(tour.tour != params.tour) continue; 
                return res.send({message: 'Already have this tour in the shopping cart'});
            }
            const tour = {
                tour: params.tour,
                quantity: params.quantity,
                subTotal: tourExist.priceTicket * params.quantity
            }
            const total = shoppingCartExist.total + tour.subTotal;
            const quantityTours = shoppingCartExist.tours.length + 1;
            const pushTour = await ShoppingCart.findOneAndUpdate(
                {_id: shoppingCartExist._id},
                { $push: {tours: tour},
                  total: total,
                  quantityTours: quantityTours},
                {new: true}
            )

            
            const stockTour = (tourExist.stockTicket - tour.quantity)         
            await Tour.findOneAndUpdate({_id: data.tour}, {stockTicket: stockTour }, {new: true});

           

            if(!pushTour) return res.send({message: 'Tour not add to shopping cart'});
            return res.send({message: 'New tour add to Shopping Cart', pushTour});
        }
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error saving Tour to shopping cart'});
    }
}

exports.deleteShoppCart = async(req, res)=>{
    try{
          const userId = req.user.sub;
        let cleanShoppingCart = await ShoppingCart.findOneAndRemove({ user: userId }).lean();
        if (cleanShoppingCart === null) {
            return res.send({ message: 'No tienes ningun producto en tú carrito' })
        } else {
            return res.send({ message: 'Se han removido los productos de tu carrito' });
        }
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error deleting shopping cart'});
    }
}

exports.getShoppCart = async(req, res)=>{
    try{
        const shoppCartId = req.params.id;
        const shoppCart = await ShoppingCart.findOne({_id: shoppCartId});
        if(!shoppCart) return res.status(404).send({message: 'Shopping cart not found'});
        return res.send({message: 'Shopping cart found:', shoppCart});
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error getting shopping cart'});
    }
}