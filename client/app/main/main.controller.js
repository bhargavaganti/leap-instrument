'use strict';

angular.module('midiserverApp')
  .controller('MainCtrl', function ($scope, $http, $timeout) {
    $scope.awesomeThings = [];

    // $http.get('/api/things').success(function(awesomeThings) {
    //   $scope.awesomeThings = awesomeThings;
    // });

	// $scope.scaleArray = ["E3", "G3", "A3", "B3", "D4", "E4", "G4", "A4", "B4", "D5", "E5"];
	$scope.scaleArray = [];
	$scope.note = 0;

	var synth = new Tone.MonoSynth();
	var fx = new Tone.PingPongDelay("4n");
	$scope.volNormalised;


	var controller = new Leap.Controller({
	      enableGestures: false
	});

	controller.on('connect', function() {
	  console.log("Leap Motion connected!");

	  setInterval(function(){
	      var frame = controller.frame();
	      var hand = frame.hands[0];


	      if (hand) {
	        var actualHeight = hand.palmPosition[1];
	        var mappedHeight = floor(map(actualHeight, 100, 400, 0, $scope.scaleArray.length));
	        mappedHeight = constrain(mappedHeight, 0, $scope.scaleArray.length-1);
	        var grabStrength = hand.grabStrength;
	        $scope.volNormalised = 1-grabStrength;
	        var rotation = hand.roll();
	        // console.log("actualHeight: ", actualHeight, " / mappedHeight: ", mappedHeight, "grabStrength: ", grabStrength, "rotation: ", rotation);

	        $scope.note = mappedHeight;

	        var midiValue = $scope.scaleArray[$scope.note];
	        // var freqValue = midiToFreq(midiValue);

	        if ($scope.scaleArray.length > 0) {
		        synth.triggerAttackRelease(synth.midiToNote($scope.scaleArray[$scope.note]));
		    }
	        var volDb = 0 - grabStrength * 50;
	        synth.setVolume(volDb, 0.05);
	        // osc.freq(freqValue, 0.1);
	        // osc.amp(1-grabStrength, 0.05);

	      } else {
	        synth.setVolume(-100, 1);
	        // osc.amp(0, 1);
	      }


	  }, 50);

	});

	controller.connect();

	fx.setFeedback(0.3);
	synth.connect(fx);
	fx.toMaster();
	fx.setWet(0.5);

	synth.setPortamento(0.1);

	Tone.Transport.start();

	var socket = io();

	$scope.console = "";


	var lastMidi;
	$scope.notes = [];

    socket.on('connect', function() {
      console.log("Connected to socket IO server");
      socket.on('midi', function(msg, deltaTime) {
        console.log("Got a message: ", msg);

    	var newNote = { n: msg[1], t: deltaTime };
        
        var add = false;
        if (lastMidi) {
	        if (lastMidi.n != msg[1] && lastMidi.t != deltaTime) {
	        	add = true;
	        	lastMidi = newNote;
	        	console.log("OK to add this note");
	        } else {
	        	console.log("Duplicate note / time rejected");
	        }

        } else {
        	add = true;
        	lastMidi = newNote;
        }
        if (add) {
	        $timeout(function() {
	        	$scope.scaleArray.push( newNote.n );
	        });
	    }
      });
    });

 






  });