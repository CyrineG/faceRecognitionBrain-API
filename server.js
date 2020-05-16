const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors= require('cors');
const knex = require('knex');


const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'root',
    database : 'facerecognition'
  }
});

db.select('*').from('users').then(data => {
	console.log(data);
} );

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.post('/signin', (req, res) => {
	db.select('email', 'hash').from('login')
	  .where('email','=', req.body.email)
	  .then(data => {
	  	console.log(data);
	  	const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
	  	if (isValid){
	  		return db.select('*').from('users')
	  		  .where('email','=', data[0].email)
	  		  .then(user => {
	  		  	res.json(user[0])
	  		  })	
	  		  .catch(err => res.status(400).json('unable to get user'))
	  	} else {
	  		res.status(400).json('wrong credentials');
	  	}
	  })
})

app.post('/register', (req, res)=> {
	const {email, name, password } = req.body;
	const hash = bcrypt.hashSync(password);
	db.transaction(trx => { 

		trx.insert({

			hash: hash,
			email: email

		}).into('login').returning('email')
		.then (loginEmail => {

			return trx('users')
			.returning('*')
			.insert({
				name: name,
				email: loginEmail[0],
				joined: new Date()
			})
			.then(user => {
			res.json(user[0]);
			})

		})
		.then(trx.commit)
		.catch(trx.rollback);
		
	})
	.catch(err => res.status(400).json('unable to register'));
})

app.get('/', (req, res)=> {
	res.send(database);
})

app.get('/profile/:id', (req, res) => {
	const {id} = req.params;
	let found = false;
	//find user with matching id
	db.select('*').from('users').whre({id})
	.then(user => {
		if(user.length) {
			return res.json(user);
		}else {
			res.status(400).json('not found');
		}
	})
	
})

app.put('/image', (req, res) => {
	const {id} = req.body; //we get the user id from the body
	//find user with matching id
	db('users').where('id', '=', id)
	.increment('entries', 1)
	.returning('entries')
	.then(entries => {
		res.json(entries[0]);
	}).catch(err => res.status(400).json('unable to get entries'))
})


// Load hash from your password DB.
/*bcrypt.compare("bacon", hash, function(err, res) {
    // res == true
});
bcrypt.compare("veggies", hash, function(err, res) {
    // res = false
});*/

app.listen(3001, ()=> {
	console.log('app is running on port 3001')
})
