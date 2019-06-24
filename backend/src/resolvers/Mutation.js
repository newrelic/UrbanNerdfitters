const bycrpt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {randomBytes} = require('crypto')
const {promisify} = require('util')
const {transport, makeEmail} = require('../mail')
const {hasPermission} = require('../utils')
const stripe = require('../stripe')

const mutations = {
    async createItem(parent, args, ctx, info){
        // Check if the user is logged in
        if(!ctx.request.userId){
            throw new Error('You must be logged in to delete')
        }
        const item = await ctx.db.mutation.createItem(
            {
                data: {
                    // Create a relationship between the Item and User
                    user: {
                        connect: {
                            id: ctx.request.userId
                        }
                    },
                    ...args
                }
            },
            info
        );
        return item;
    },
    updateItem(parent, args, ctx, info){
        // take a copy of update
        const updates = {...args};
        // remove id
        delete updates.id;
        // run update method
        return ctx.db.mutation.updateItem({
            data: updates,
            where: {
                id: args.id
            }
        }, info);
    },
    async deleteItem(parent, args, ctx, info){
        const where = {id: args.id};
        // Find Item
        const item = await ctx.db.query.item({where}, `{id title user{id}}`)
        // Check permissions to delete
        const ownsItem = item.user.id === ctx.request.userId;
        const hasPermissions = ctx.request.user.permissions.some(permission => ['ADMIN', 'ITEMDELETE'].includes(permission))
        if (!ownsItem || !hasPermission){
            throw new Error('You can not delete this item. Please contact the admin.')
        }
        //Delete
        return ctx.db.mutation.deleteItem({where}, info)
    },
    async signup(parent, args, ctx, info){
        // make email address lower case
        args.email = args.email.toLowerCase();
        // hash password
        const password = await bycrpt.hash(args.password, 10)
        //create user in DB
        const user = await ctx.db.mutation.createUser({
            data: {
                ...args,
                password,
                permissions: { set: ['USER'] },
            }
        }, info);
        //Create JWT Token && and set as cookie on response
        const token = jwt.sign({userId: user.id}, process.env.APP_SECRET)
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
        });

        //Return new user
        return user;

    },
    async signin(parent, {email, password}, ctx, info){
        // Check for user with email
        const user = await ctx.db.query.user({where: {email}});
        if(!user) {
            throw new Error(`No user found for ${email}`)
        }
        // Check password
        const valid = await bycrpt.compare(password, user.password);
        if(!valid){
            throw new Error('Invalid Password');
        }
        // Create JWT token
        const token = jwt.sign({userId: user.id}, process.env.APP_SECRET)
        // Set cookie
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
        });
        // Return User
        return user;
    },
    signout(parent, args, ctx, info){
        ctx.response.clearCookie('token');
        return {messgae: 'Peace out!'}
    },
    async requestReset(parent, args, ctx, info){
        // Check if real user
        const user = await ctx.db.query.user({where: {email: args.email}})
        if(!user) {
            throw new Error(`No user found for ${args.email}`)
        }
        // Set reset token and expiry on the user
        const randomBytesPromiseified = promisify(randomBytes);
        const resetToken = (await randomBytesPromiseified(20)).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour
        const res = await ctx.db.mutation.updateUser({
            where: {email: args.email},
            data: {resetToken, resetTokenExpiry}
        });
        // Email the rest token
        const mailRes = await transport.sendMail({
            from: 'jae@nerdstore.io',
            to: user.email,
            subject: 'Password Reset',
            html: makeEmail(`This is it. <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">Reset</a>`)
        })
        return {messgae: "thanks!"};
    },
    async resetPassword(parent, args, ctx, info){
        //Check if passwords match
        if(args.password !== args.confirmPassword){
            throw new Error('The passwords do not match');
        }
        //Check is rest token is legit
        //Check if expired
        const [user] = await ctx.db.query.users({where: {
            resetToken: args.resetToken,
            resetToken_gte: Date.now() - 3600000
            }
        })
        if(!user){
            throw new Error('This token is not valid');
        }
        //Hash and save password
        const password = await bycrpt.hash(args.password, 10);
        const updatedUser = await ctx.db.mutation.updateUser({
            where: {email: user.email},
            data: {password,
            resetToken: null,
            resetTokenExpiry: null
            }
        });
        //Remove reset token field
        const token = jwt.sign({userId: updatedUser}, process.env.APP_SECRET);
        //Create and Save JWT
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365
        })
        //Return new user
        return updatedUser;
    },
    async updatePermissions(parent, args, ctx, info){
        //Check if logged in
        if(!ctx.request.userId){
            throw new Error('Must be logged in');
        }
        //Query current user
        const currentUser = await ctx.db.query.user({where: {
            id: ctx.request.userId,
        }}, info)
        //Check for right permissions
        hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);
        //Update permission
        return ctx.db.mutation.updateUser({
            data: {permissions: {set: args.permissions}},
            where: {id: args.userId},
        }, info)
    },
    async addToCart(parent, args, ctx, info) {
        // 1. Make sure they are signed in
        const { userId } = ctx.request;
        if (!userId) {
          throw new Error('You must be signed in');
        }
        // 2. Query the users current cart
        const [existingCartItem] = await ctx.db.query.cartItems({
          where: {
            user: { id: userId },
            item: { id: args.id },
          },
        });
        // 3. Check if that item is already in their cart and increment by 1 if it is
        if (existingCartItem) {
          console.log('This item is already in their cart');
          return ctx.db.mutation.updateCartItem(
            {
              where: { id: existingCartItem.id },
              data: { quantity: existingCartItem.quantity + 1 },
            },
            info
          );
        }
        // 4. If its not, create a fresh CartItem for that user!
        return ctx.db.mutation.createCartItem(
          {
            data: {
              user: {
                connect: { id: userId },
              },
              item: {
                connect: { id: args.id },
              },
            },
          },
          info
        );
      },
    async removeFromCart(parent, args, ctx, info){
        // Find cart item
        const cartItem = await ctx.db.query.cartItem({
            where: {
                id: args.id
              }
        }, `{id, user {id}}`)
        if(!cartItem){
            throw new Error('No Item Found')
        }
        // Make sure the user owns the cart item
        if(cartItem.user.id !== ctx.request.userId){
            throw new Error('Sikeeeee!')
        }
        // Delete cart item
        return ctx.db.mutation.deleteCartItem({
            where: {
                id: args.id
            }
        }, info)
    },
    async createOrder(parent, args, ctx, info){
        // Query current user and make sure they are signed in
        const {userId} = ctx.request
        if(!userId) throw new Error('You must be logged in')
        const user = await ctx.db.query.user({ where: {id: userId}}, `{
            id
            name
            email
            cart {id quantity item {title price id description image largeImage}}
        }`);
        // Recalculate the total for the prcie
        const amount = user.cart.reduce((tally, cartItem) => tally + cartItem.item.price * cartItem.quantity, 0)
        console.log(amount)
        // Create the stripe charge
        const charge = await stripe.charges.create({
            amount,
            currency: "USD",
            source: args.token
        });
        // Covert cart items to order items
        const orderItems = user.cart.map(cartItem => {
            const orderItem = {
                ...cartItem.item,
                quantity: cartItem.quantity,
                user: {connect: {id: userId}}
            };
            delete orderItem.id;
            return orderItem;
        })
        // Create order
        const order= await ctx.db.mutation.createOrder({
            data: {
                total: charge.amount,
                charge: charge.id,
                items: { create: orderItems },
                user: {connect: {id: userId}}
            }
        })
        // Clean up
        const cartItemIds = user.cart.map(cartItem => cartItem.id)
        await ctx.db.mutation.deleteManyCartItems({
            where: {
                id_in: cartItemIds
            }
        })
        // Return order to client
        return order;
    }
};

module.exports = mutations;
