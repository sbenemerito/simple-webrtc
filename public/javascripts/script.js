/**
 * Socket IO Client
 */
const socket = io.connect('localhost:3000'); // Change to ngrock link when testing
socket.on('someone connected', function (data) {
  console.log('someone connected!');
});

socket.on('someone disconnected', function (data) {
  console.log('someone disconnected!');
});

socket.on('data broadcast', function(data) {
  var sender = data.id;
  if (sender != yourId) {
    if (data.ice != undefined) {
      pc.addIceCandidate(new RTCIceCandidate(data.ice));
    } else if (data.sdp == undefined) {
      console.log('peer disconnected from webrtc');
    } else if (data.sdp.type === "offer") {
      console.log(data, 'received data');
      pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
        .then(function() {
          return pc.createAnswer();
        })
        .then(function(answer) {
          return pc.setLocalDescription(answer);
        })
        .then(function() {
          socket.emit('ice candidate', {id: yourId, sdp: pc.localDescription});
        })
        .catch(function(err) {
          console.log(err, 'error');
          console.log(err.message, 'error message');
        });
    } else if (data.sdp.type === "answer") {
      pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    }
  }
});

/**
 * WebRTC
 */
const ownVideo = document.getElementById("ownVideo");
const peerVideo = document.getElementById("peerVideo");

var yourId = Math.floor(Math.random() * 1000000000);

// WebRTC needs STUN or TURN servers for 'pointers'
const servers = {
  'iceServers': [
    {
      'urls': 'stun:stun.services.mozilla.com'
    },
    {
      'urls': 'stun:stun.l.google.com:19302'
    },
    {
      'urls': 'turn:numb.viagenie.ca',
      'credential': 'bit@okutama594',
      'username': 'grimgust01@gmail.com'
    }
  ]
};

var pc = new RTCPeerConnection(servers);
pc.onicecandidate = function(event) {
    return event.candidate 
      ? socket.emit('ice candidate', {id: yourId, ice: event.candidate})
      : console.log("Sent All Ice");
};

pc.onaddstream = function(event) {
  peerVideo.srcObject = event.stream;
};

pc.onconnectionstatechange = function(event) {
  console.log(pc.connectionState + ' webrtc!');
};

// pc.oniceconnectionstatechange = function() {

//   if (pc.iceConnectionState == 'disconnected') {
//     socket.emit('webrtc disconnected', {id: yourId});
//   }
// };

function sendMessage(senderId, data) {
    var msg = database.push({
      sender: senderId,
      message: data
    });
    msg.remove();
}

function streamOwn() {
  console.log(navigator.mediaDevices, 'devices');
  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  })
    .then(function(stream) {
      ownVideo.srcObject = stream;
      pc.addStream(stream);
    });
}

function streamPeer() {
  pc.createOffer()
    .then(function(offer) {
      return pc.setLocalDescription(offer);
    })
    .then(function() {
      socket.emit('ice candidate', {id: yourId, sdp: pc.localDescription});
    });
}