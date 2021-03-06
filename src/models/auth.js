const bcrypt = require('bcrypt');

class Authentication {

  constructor(db) {
    this.db = db;
  }
  async register(email, password) {
    let alreadyRegistered = await this.checkExistingEmails(email);

    if(alreadyRegistered) return { error: { message: 'email_already_in_use', data: email } };

    let rounds = 12;
    return bcrypt.genSalt(rounds)
      .then(salt => {
        return bcrypt.hash(password, salt);
      })
      .then(hash => {

        return this.db('users').insert({
          'email': email,
          'hash': hash,
          'time_created': new Date()
        }).returning('email');
      })
      .catch(err => {
        return { error: { message: err } };
      });
  }

  login(email, password) {
    if(this.checkExistingEmails(email)) {
      return this.db('users').where('email', email)
        .limit(1)
        .then((res) => {
          if(!res || res.length === 0) return { error: { message: 'email_or_password_wrong' } };

          let { hash, user_id, email } = res[0];
          hash = Buffer.from(hash);

          return bcrypt.compare(password, hash.toString('utf-8'))
            .then(check => {

              if(check) {
                return { 
                  id: user_id, 
                  email: email 
                };
              } else { 
                return { error: { message: 'email_or_password_wrong' } };
              }
            });
        });
    } else {
      return { error: { message: 'email_or_password_wrong' } };
    }
  }

  async checkExistingEmails(email) {

    return this.db('users').where('email', email)
      .returning('email')
      .then(mail => mail === email);
  }
}

module.exports = Authentication;
