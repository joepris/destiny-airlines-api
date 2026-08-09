const jwt = require("jsonwebtoken");

require("dotenv").config();

module.exports.createAccessToken = (user) => {
	const data = {
		id: user._id || user.id,
		email: user.email,
		isAdmin: user.isAdmin
	}
	
	// Include any additional properties (like resetOnly)
	if (user.resetOnly !== undefined) {
		data.resetOnly = user.resetOnly;
	}
	
	return jwt.sign(data, process.env.JWT_SECRET_KEY, {});
}

module.exports.verify = (req, res, next) => {
	console.log(req.headers.authorization);
	let token = req.headers.authorization;
	if(typeof token === "undefined"){
		console.log ("No Token");
        return res.status(401).send({auth: "Failed. No Token"});
    }
    else{
    	token = token.slice(7,token.length);
    	console.log (token);

    	jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedToken) => {
			if(err){
			    return res.status(401).send({
			        auth: "Failed",
			        message: err.message
			    })
			}
			else{
			    req.user = decodedToken;

			    next();
			}    
		});
	}
}

module.exports.verifyAdmin = (req, res, next) => {
	if(req.user.isAdmin == true){
		next();
	} else{
		return res.status(403).send({
			auth: "Failed",
			message: "Action Forbidden"
		});
	}
}

module.exports.errorHandler = (err, req, res, next) => {
    const errorMessage = err.message || "Internal Server Error";

    let formattedError = {
        error: {
            message: errorMessage,
            errorCode: err.code || "SERVER_ERROR",
            details: err.details || null
        }
    };

    if(formattedError.error.message.includes("Course validation failed")){
        return res.status(400).send("You need to check your required fields if it has inputs")
    }
    else{
        return res.status(err.statusCode || 500).json(formattedError)
    }
}

module.exports.isLoggedIn = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.sendStatus(401);
    }
}
