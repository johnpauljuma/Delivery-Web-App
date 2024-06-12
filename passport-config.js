// const { authenticate, initialize } = require('passport');

const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

function initialize(passport, getUserByEmail, getUserById){
    const authenticateUser = async (email, password, done) =>{
        const user = getUserByEmail(emial);
        if (user == null) {
            return done(null, false, { message: 'No user with that email.'});
        }

        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user)
            }
            else {
                return done(null, false, { message: 'Password incorrect'})
            }
            
        } catch (error) {
            return done(error)
        }
    }

    passport.use(new LocalStrategy({ usernameField: 'emil'},
    authenticateUser));

    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => {
        done(null, getUserById(id))
    });

}

module.exports = initialize;