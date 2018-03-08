const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.enlaceCreado = functions.database.ref('marcadoresCompartidos/{pushId}')
  .onCreate(gestionarNuevoEnlaceCompartido);


function gestionarNuevoEnlaceCompartido(event) {
  const enlace = event.data.val();
  console.log('Creado un enlace', event.data.key, enlace);
  if(!enlace || enlace.lastShared) {
    return false;
  }
  payload = generarPayload(enlace);
  console.log('Payload generado: ', payload);
  return recuperarTokens(admin)
    .then( tokens => admin.messaging().sendToDevice(tokens, payload) )
    .then( response => logResponse(response) )
    .then(  () => registrarLastShared(event.params.pushId) )
    .catch( (err) => console.log('error:', err) );
}

function generarPayload(enlace) {
  return { 
    "notification": { 
      "title": enlace.titulo || 'Sin título', 
      "body": enlace.descripcion || 'Sin descripción',
      "link": "/contacto",
      "icon": "/images/manifest/icon-96x96.png" 
    }
  };
}

function recuperarTokens(admin) {
  return new Promise( (resolve, reject) => {
    admin.database().ref('userNotificationToken').once('value', (snapshot) => {
      const obj = snapshot.val();
      const deviceTokens = [];
      for (const key in obj) {
        console.log('key', key);
        if(obj[key]) {
          deviceTokens.push(obj[key]);
          console.log('token a array', obj[key])
        }
      }
      resolve(deviceTokens);
    });
  });
}

function logResponse(response) {
  console.log('mensajes enviados', response);
  return 1;
}

function registrarLastShared(pushId) {
 return admin.database().ref('marcadoresCompartidos/').child(pushId).child('lastShared').set(Date.now());
}
