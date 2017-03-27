const AVSConnection = require('./AVSConnection');
const avsConnection = new AVSConnection();


setTimeout( () => {
  avsConnection.connectSpdy();
},  1000);
