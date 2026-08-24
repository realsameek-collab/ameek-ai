import { getAuth } from "firebase-admin/auth";
import { app } from "../config/firebase.js";
import User from "../models/user.model.js";
import { randomUUID } from "crypto";
import redis from "../../../shared/redis/redis.js";

export const login = async (req, res) => {

     try{
          // accept token from Authorization header (Bearer) or from body
          let token = req.body?.token;
          const authHeader = req.headers?.authorization || req.headers?.Authorization;
          if (!token && authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
          }
          const decoded = await getAuth(app).verifyIdToken(token);
          let user = await User.findOne({
          firebaseUid: decoded.uid
          })
          if(!user){

               user=await User.create({

                    firebaseUid:decoded.uid,
                    name:decoded.name,
                    email:decoded.email,
                    avatar:decoded.picture
               })

          }

const sessionId = randomUUID();
          await redis.set(`session-${sessionId}`, JSON.stringify({
                userId: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar
          }));

          await redis.expire(`session-${sessionId}`, 7 * 24 * 60 * 60);

const cookieOptions = {
             httpOnly: true,
             secure: process.env.NODE_ENV === 'production',
             sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
             maxAge: 7*24*60*60*1000,
             path: '/'
          };

          res.cookie("session", sessionId, cookieOptions);

          return res.status(200).json({message:"Login successful",user})

       }catch(error){
            console.error('Auth login error:', error);
            res.status(500).json({message:"Login failed",error:error.message})
       }

     }

     export const logout = async (req, res) => {

            try{

             const sessionId = req.cookies?.session;
             await redis.del(`session-${sessionId}`);
             res.clearCookie("session");
             return res.status(200).json({message:"Logout successful"})
            }
            catch(error){

               return res.status(500).json({message:"Logout failed",error:error.message})
            }

     }