import { response } from "express";
import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req,res) => {
  try{
    const {fullname, email, phoneNumber, Password, role} = req.body;
    if(!fullname || !email || !phoneNumber || !role || !Password){
      return res.status(400).json({
        message: "Something is missing",
        success:false
      });
    };

    const user = await User.findOne({email});
    if(User){
      return res.status(400).json({
        message: 'User already exists with this email',
        success:false
      })
    }

    const hashPassword = await bcrypt.hash(Password, 10);

    await User.create({
      fullname,
      email,
      phoneNumber,
      Password:hashPassword,
      role,
    })
    
    return res.status(201).json({
      message:"Account successfully created",
      success:true
    });

  }catch (error){
    console.log(error);
  }
}

export const login = async (req, res) => {
  try{

    const {email, Password, role} = req.body;
    if(!email || !Password || !role){
      return res.status(400).json({
        message: "something is missing",
        success:false
      });
    };

    let user = await User.findOne({email});
    if(!user){
      return res.status(400).json({
        message:"Incorrect email or password.",
        success:false
      });
    };

    const isPasswordMatch = await bcrypt.compare(Password, user.Password);
    if(!isPasswordMatch){
      return res.status(400).json({
        message:"Incorrect password or email.",
        success:false
      });
    };

    // check the role 
    if(role != user.role){
      return res.status(400).json({
        message:"Account doesn't exist with current role",
        success:false
      });
    };

    const tokenData = {
      userID:user._id
    }
    
    const token = await jwt.sign(tokenData, process.env.SECRET_KEY, {expiresIn:'1d'});
    
    user = {
      _id:user._id,
      fullname: user.fullname,
      email:user.email,
      phoneNumber: user.phoneNumber,
      role:user.role,
      profile:user.profile
    }


    return res.status(200).cookie("token", token, {maxAge:1*24*60*60*1000, httpsOnly:true, sameSite: 'strict'}).json({
      message:`Welcome back ${user.fullname}`,
      user,
      success:true
    })
  }catch (error) {
    console.log(error);
  }
  
}

export const logout = async (req, res) =>{
  
  try{
    return res.status(200).cookie("token", "", {maxAge:0}).json({
      message:"Logout Successful!",
      sucess:true
    })
  }catch (error){
    console.log(error);
  }
}

export const updateProfile = async (req, res) =>{
  try{

    const {fullname, email, phoneNumber,bio, skills} = req.body;
    const file = req.file;
    if(!fullname || !email || !phoneNumber || !bio || !skills){
      return res.status(400).json({
        message: "Something is missing",
        success:false
      });
    }

    // cloudinary will be here 

    const skillsArray = skills.split(",");
    const userId = req.id; // middleware authentication
    let user = await findById(userId);

    if(!user){
      return res.status(400).json({
        message:"user not found.",
        success:false
      });
    };
    
    // updating new things
    user.fullname = fullname,
    user.email = email,
    user.phoneNumber= phoneNumber,
    user.profile.bio = bio,
    user.profile.skills = skillsArray
    
    // resume will be added later

    await user.save()
    

    user = {
      _id:user._id,
      fullname: user.fullname,
      email:user.email,
      phoneNumber: user.phoneNumber,
      role:user.role,
      profile:user.profile
    }
     
    return res.status(200).json({
      message:"Profile updated successfully",
      user,
      success:true
    })

  }catch (error){
    console.log(error);
  }
}