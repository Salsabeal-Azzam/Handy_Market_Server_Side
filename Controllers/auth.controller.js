const User = require("../Models/User.model");
const sendEmail = require("../services/sendEmail");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const path = require('path');



//Test Done
const signup = async (req, res)=>{
    try {
        //, full_name , phone ,address
        const {user_name , email , password , age , gender , role ,phone ,address , confirmPassword} = req.body;
        const newUser = new User({user_name , email , password , age , role , gender , phone , address});
        const savedUser = await newUser.save();
        if (!savedUser){
            res.status(503).json({message:"Sorry , Please try to signup agian"})
        } else {
            const token = jwt.sign({id:savedUser._id} ,process.env.EMAIL_TOKEN , {expiresIn: 5 * 60 });

            const link = `${req.protocol}://${req.headers.host}/api/v1/auth/confrimEmail/${token}`;
            const link2 = `${req.protocol}://${req.headers.host}/api/v1/auth/resendToken/${savedUser._id}`;
            const message = `<a href =${link}>Plase Follow me to Confrim your account</a> <br>
            <a href = ${link2}>re-send confrimation Email</a>`;
           
            sendEmail(savedUser.email , message).then(()=>{
                res.status(201).json({message:"Done" , savedUser });
            }).catch(()=>{
                res.status(409).json({message:"Email not Right One"});
            })
        }
    } catch (error) {
        console.log(error);
        if (error.keyValue?.email) {
            
            res.status(409).json({message:"Email Exist"});
        } else {
            console.log(error);
            res.status(500).json({message:"catch error : " + error.message }); 
        }
    }
}

const sellerSignup = async (req, res)=>{
    try {
        const {user_name , email , password , age , gender , role , phone , address , full_name  , shop_name ,  description , confirmPassword} = req.body;
        const newUser = new User({user_name , email , password , age , role , gender , phone , address , full_name  ,description ,shop_name});
        const savedUser = await newUser.save();
        if (!savedUser){
            res.status(503).json({message:"Sorry , Please try to signup agian"})
        } else {
            const token = jwt.sign({id:savedUser._id} ,process.env.EMAIL_TOKEN , {expiresIn: 5 * 60 });

            const link = `${req.protocol}://${req.headers.host}/api/v1/auth/confrimEmail/${token}`;
            const link2 = `${req.protocol}://${req.headers.host}/api/v1/auth/resendToken/${savedUser._id}`;
            const message = `<a href =${link}>Plase Follow me to Confrim your account</a> <br>
            <a href = ${link2}>re-send confrimation Email</a>`;
           
            sendEmail(savedUser.email , message).then(()=>{
                res.status(201).json({message:"Done" , savedUser })
            }).catch(()=>{
                res.status(409).json({message:"Email not Right One"});
            })
        }
    } catch (error) {
        console.log(error);
        if (error.keyValue?.email) {
            
            res.status(409).json({message:"Email Exist"});
        } else {
            console.log(error);
            res.status(500).json({message:"catch error : " + error.message }); 
        }
    }
}

//Test Done
const resendToken  = async(req, res)=>{

    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) {
            res.status(400).json({ message: "in-valid account" });
        } else {
            if (user.confirm_email) {
                res.status(409).json({ message: "already confirmed" })
            } else {
                if (user.number_of_token > 5) {
                    sendEmail(user.email ,`Sorry you can't resend confrim email any more please connect with Admian`).then(()=>{ 
                    });
                    res.status(409).json({ message: "Sorry you can't resend confrim email any more" })
                } else {
                    const updatedUser = await User.findByIdAndUpdate({_id:user.id} ,{$inc:{number_of_token:1}}, {new:true});
    
                    const token = jwt.sign({id:user._id} ,process.env.EMAIL_TOKEN , {expiresIn: 2 * 60});
                    const link = `${req.protocol}://${req.headers.host}/api/v1/auth/confrimEmail/${token}`;
                    const link2 = `${req.protocol}://${req.headers.host}/api/v1/auth/resendToken/${user._id}`;
            
                    const message = `<a href =${link}>Plase Follow me to Confrim your account</a> <br>
                    <a href = ${link2}>Refresh Token</a>`;
            
                    sendEmail(user.email , message).then(()=>{    
                        res.status(201).json({message:"Done plz check u email now"})
                    }).catch(()=>{
                        res.status(409).json({message:"Email not Right One"});
                    })
                }
    
            }
        }
    
    } catch (error) {
            res.status(500).json({message:"Catch Error" , error})
    }

}

//Test Done
const cofrimEmail = async(req, res)=>{
    try {
        const {token} = req.params ;
        const decoded = jwt.verify(token , process.env.EMAIL_TOKEN);
        if (!decoded) {
            res.status(400).json({message:"In-valid Token"})
        } else {
            const user = await User.findById(decoded.id).select('confirm_email');
            if (!user) {
                res.status(404).json({message:"In-valid User ID"})
            } else {
                if (user.confirm_email) {
                    res.status(400).json({message:"You already confrimed Please procced to login Pages"});
                } else {
                    await User.findOneAndUpdate({_id:user._id} , {confirm_email:true})
                    // res.status(200).json({message:"Done Please log In"});
                    res.sendFile(path.join(__dirname, '../welcom.html'));

                }
            }
        }
        
    } catch (error) {
        if(error.message == "jwt expired"){
            res.status(500).json({message:"Your Token is Expired"})
        }else{
            res.status(500).json({message:"Catch Error" , error})
        }
    }

}

//Test Done
const login = async (req, res)=>{

    try {
        const {email , password ,rememberMe} = req.body ;
        const user = await User.findOne({email});
        if (!user) {
            res.status(404).json({message:"In-vaild Email"})
        } else {
            if (!user.confirm_email) {
                res.status(400).json({message:"Please confrim your Email first "});
            } else {
                if (user.deActivated) {
                    res.status(400).json({message:"Your Acount is deactivated"})
                } else {
                    if (user.isBlocked) {
                        res.status(400).json({message:"Your acccount has bloced by Admin "});
                    } else {
                        const match = await bcrypt.compare(password , user.password);
                        if (!match) {
                            res.status(400).json({message:"Email and Password misMatch"});
                        } else {
                            // I append Check if already login or not
                            if(user.active){
                               res.status(400).json({message:"You are Already Login."})
                            }
                            else{
                                let expiresIn = '24h';
                                if (rememberMe){
                                    expiresIn = '7d' 
                                }
                                const token = jwt.sign({id:user._id , isLoggedIn:true} , process.env.TOKEN_SIGNATURE , {expiresIn});
                                const updateStaus = await User.findByIdAndUpdate(user._id , {active:true , _Token:token} , {new:true}).select('-_id active');
                                res.status(201).json({message:"Login Success" , token , userId: user._id , role:user.role});
                            }
                        }  
                    }
                }

            }
    
        }
    } catch (error) {
        res.status(500).json({message:"Catch Error : " + error.message})
    }

}

//Test Done ...>send Code to email
const sendCode = async(req, res)=>{

    try {
        const {email} = req.body;
        const user = await User.findOne({email});
        if (!user) {
            res.status(404).json({message:"In-valid account"})
        } else {
            const code = Math.floor(Math.random() * (9999 -1000 + 1) + 10000)
           const codeUser = await User.findByIdAndUpdate({_id:user._id} ,{code},{new:true})
            const message = `<p>use this code to change u password : ${code}</p>`
            sendEmail(email , message).then(()=>{
                res.status(200).json({message:"Done , Please cheack Your Email"})
            }).catch(()=>{
                res.status(409).json({message:"Email not Right One"});
            })
        }

    } catch (error) {
        res.status(500).json({message:"Catch Error" , error})
    }
}
// check code 
const checkCode = async(req, res)=>{

    try {
        const { code } = req.body;
        const user = await User.findOne({code});
        if (user.code.toString() != code.toString()){
           res.status(409).json({message:"wrong code"})
        }else{
            res.status(200).json({message:"Done Right code  to Your Email"});
        }
        
    } catch (error) {
        res.status(500).json({message:"Catch Error" , error})
    }
}

//forgetPassword    // Want Descuss Here !!! -> how know if user enter another email for another user in this case change password for another user
const forgetPassword = async(req, res)=>{

    try {
        const {email , newPassword} = req.body;
        const user = await User.findOne({email});
        if (!user) {
            res.status(404).json({message:"In-valid account"})
        } else {
            const hashPassword = await bcrypt.hash(newPassword, parseInt(process.env.SALT_ROUND));
            const updatePassword = await User.findByIdAndUpdate({_id:user._id} , {password:hashPassword , code:""} , {new:true});
            res.status(200).json({message:"Done update Your Password , Login now" , updatePassword});
        }

    } catch (error) {
        res.status(500).json({message:"Catch Error : " + error.message})
    }
}


const signOut = async(req, res)=>{
    try {
        const {_id} = req.user
        // Convert From Const to let & add {new: true}
        let userLogOut = await User.findByIdAndUpdate(_id , {
            lastSeen :moment().format() ,
            active: false, 
            _Token:null
        }, {new: true} ).select('-_id active lastSeen');
        if (!userLogOut) {
            res.status(503).json({message:"Sorry , Please try to Logout agian"})
        } else {
            res.status(200).json({message:"DONE SignOut" , userLogOut})
        }
    } catch (error) {
        res.status(500).json({message:"Catch Error AN controler" , error})
    }
}
module.exports = {
    signup ,
    cofrimEmail , 
    resendToken , 
    login ,
    sendCode ,
    forgetPassword ,
    signOut ,
    checkCode ,
    sellerSignup
}