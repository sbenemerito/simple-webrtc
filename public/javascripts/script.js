/**
 * Socket IO Client
 */
const socket = io.connect('localhost:3000');
socket.on('news', function (data) {
  console.log(data);

  socket.emit('my other event', { my: 'data' });
});

socket.on('data broadcast', function(data) {
  var sender = data.id;
  if (sender != yourId) {
    if (data.ice != undefined) {
      pc.addIceCandidate(new RTCIceCandidate(data.ice));
    } else if (data.sdp.type === "offer") {
      pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
        .then(function() {
          pc.createAnswer();
        })
        .then(function(answer) {
          pc.setLocalDescription(answer);
        })
        .then(function() {
          socket.emit('ice candidate', {id: yourId, sdp: pc.localDescription});
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
    })
    .then(function(stream) {
      pc.addStream(stream);
    });
}

function streamPeer() {
  pc.createOffer()
    .then(function(offer) {
      pc.setLocalDescription(offer);
    })
    .then(function() {
      socket.emit('ice candidate', {id: yourId, sdp: pc.localDescription});
    });
}