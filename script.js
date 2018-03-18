'use strict';
(function() {
  document.addEventListener('DOMContentLoaded', (e) => {

    const video = document.querySelector('.main__video');
    const canvas = document.querySelector('.main__canvas');
    const main = document.querySelector('.main');

    let blinkingElements = new Set;
    
    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    })
      .then((stream) => {
        video.srcObject = stream;
        video.onloadedmetadata = (e) => {
          video.play();
        };
        _visualizeAudio(stream);
        _printCodeOutput();
      })
      .catch((err) => {
        console.log(err);
      });

    // User interface

    const menu = document.querySelector('.menu');
    _shake(menu);
    _startBlink(menu);
    
    const linkVideo = document.querySelector('.menu__item-video');
    linkVideo.addEventListener('click', _toggleVideo);
    
    const linkCanvas = document.querySelector('.menu__item-canvas');
    linkCanvas.addEventListener('click', _toggleCanvas);

    const hiddenClass = '--hidden';
    const filterClass = 'main--filter';

    function _toggleVideo(e) {
      linkVideo.classList.add('menu__item--selected');
      linkCanvas.classList.remove('menu__item--selected');
      video.classList.remove(hiddenClass);
      canvas.classList.add(hiddenClass);
      main.classList.add(filterClass);
      _stopCanvasDrawing(video);
    }
    
    function _toggleCanvas(e) {
      linkCanvas.classList.add('menu__item--selected');
      linkVideo.classList.remove('menu__item--selected');
      canvas.classList.remove(hiddenClass);
      video.classList.add(hiddenClass);
      main.classList.remove(filterClass);
      _startCanvasDrawing(video);
    }
      
    // Code output

    function _printCodeOutput() {
      const codeGenerator = new CodeGenerator;

      const leftColumn = document.querySelector('.main__text-column-left');
      _drawText({
        element: leftColumn,
        limit: 20,
        generateCode: codeGenerator.getCodeA.bind(codeGenerator)
      });
      _shake(leftColumn);

      const rightColumn = document.querySelector('.main__text-column-right');
      _drawText({
        element: rightColumn,
        limit: 10,
        generateCode: codeGenerator.getCodeB.bind(codeGenerator)
      });
      _shake(rightColumn);
    }

    function _drawText(options) {
      const {element, limit, generateCode} = options;
      const MULTIPLIER = 50;
      const NEW_LINE = '\n';
      requestAnimationFrame(async() => {
        if (!_isHidden(element)) {
          const leftColumnLength = element.textContent.split(NEW_LINE).length;
          if (leftColumnLength >= limit) {
            _startBlink(element);
            await _delay(100 * MULTIPLIER);
            _stopBlink(element);
            element.textContent = '';
          }
          const line = generateCode();
          element.textContent += line + NEW_LINE;
        }
        await _delay(10 * _random(MULTIPLIER));
        _drawText(options);
      });
    }

    class CodeGenerator {
      constructor() {
        const STARTING_POINT = 24600;
        const MAX_STARTING_LINE_NUMBER = 900;
        this._buffer = STARTING_POINT;
        this._lineCounter = this._random(MAX_STARTING_LINE_NUMBER);
      }
      getCodeA() {
        this._lineCounter++;
        const lineNumber = this._stringify(this._lineCounter, 3);
        const mainCode = this._stringify(this._generateMainCode());
        const additionalCodes = this._generateAdditionalCodes();
        return `${lineNumber}  ${mainCode}  ${additionalCodes}`;
      }
      getCodeB() {
        const MAX_SHIFT = 255;
        const SHIFT_BASE =28500;
        const mainCode = this._generateMainCode();
        const additionalCode1 = mainCode + SHIFT_BASE + this._random(MAX_SHIFT);
        const additionalCode2 = additionalCode1 + this._random(MAX_SHIFT);
        const code1 = this._stringify(mainCode, 4);
        const code2 = this._stringify(additionalCode1, 4);
        const code3 = this._stringify(additionalCode2, 4);
        return `   ${code1}     ${code2} - ${code3}`;
      }
      _generateMainCode() {
          this._buffer += this._random(16);
          return this._buffer;
      }
      _generateAdditionalCodes(maxCodes = 3) {
          const MAX_VALUE = 255;
          let codes = [];
          const limit = this._random(maxCodes);
          for (let i = 0; i < limit; i++) {
              codes.push(this._random(MAX_VALUE));
          }
          return codes.map(code => code.toString(16).toUpperCase().padStart(2, '0')).join(' ');
      }    
      _random(max) {
          return Math.floor(Math.random() * max) + 1;
      }
      _stringify(number, padding = 0) {
        return number.toString(16).toUpperCase().padStart(padding, '0');
      }
    }
  
    // Audio visualization

    function _visualizeAudio(stream) {
      const AudioContext = new (window.AudioContext || window.webkitAudioContext)();        
      if (AudioContext) {
        const audioCanvas = document.querySelector('.main__audio-display');
        const audioCanvasCtx = audioCanvas.getContext('2d');
        
        const analyser = AudioContext.createAnalyser();
        const source = AudioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 2048;
    
        _drawAudio(analyser, audioCanvas.width, audioCanvas.height, audioCanvasCtx);
        _shake(audioCanvas);
        _startBlink(audioCanvas);
      } else {
        console.log('Web Aduio API is not supported.');
      }
    }

    function _drawAudio(analyser, width, height, ctx) {
      requestAnimationFrame(draw);
      function draw() {
        ctx.clearRect(0, 0, width, height);
        _drawAudioSpectrogram(analyser, width, height, ctx);
        _drawAudioVolume(analyser, width, height, ctx);
        _drawAudio(analyser, width, height, ctx);
      }
    };

    function _drawAudioSpectrogram(analyser, width, height, ctx) {
      let data = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(data);

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, .85)';
      ctx.beginPath();

      const sliceWidth = width / data.length;
      let x = 0;

      for(let i = 0; i < data.length; i++) {

        const v = data[i] / 128.0;
        const y = v * height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
    }

    function _drawAudioVolume(analyser, width, height, ctx) {
      let data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      const avg = _avg(data);
      ctx.fillStyle = '#fff';

      const offset = width * avg / 100;
      ctx.fillRect(0, height - 10, offset, 10);
    }

    // Animations

    function _shake(element) {
      const MAX_DELAY = 50;
      requestAnimationFrame(async() =>{
        const shiftX = _random(5);
        const shiftY = _random(5);
        element.style = `transform: translate(${shiftX}px, ${shiftY}px);`;
        await _delay(10 * _random(MAX_DELAY));
        _shake(element);
      });
    }

    function _blink(element) {
      const MAX_DELAY = 1000;
      const CLASS = '--invisible';
      if (!blinkingElements.has(element)) {
        return;
      }
      requestAnimationFrame(async() =>{
        let delay = MAX_DELAY;
        if (element.classList.contains(CLASS)) {
          delay *= 10;
        }
        element.classList.toggle(CLASS);
        await _delay(_random(delay));
        _blink(element);
      });
    }

    function _startBlink(element) {
      blinkingElements.add(element);
      _blink(element);
    }

    function _stopBlink(element) {
      blinkingElements.delete(element);
    }

    // Canvas drawing
    const canvasCtx = canvas.getContext('2d');
    let isCanvasOn = false;

    function _startCanvasDrawing(video) {
      isCanvasOn = true;
      _drawCanvas(video, canvasCtx);
    }

    function _stopCanvasDrawing(video) {
      isCanvasOn = false;
    }

    function _drawCanvas(video, ctx) {
      if (!isCanvasOn) {
        return;
      }

      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      _colorCorrection(imageData.data);
      _glitch(imageData.data);
      
      ctx.putImageData(imageData, 0, 0);
      
      requestAnimationFrame(() => {
        _drawCanvas(video, ctx);
      });
    }

    function _colorCorrection(data) {
      for (let i = 0; i < data.length; i += 4) {
        const SHIFT = -80;
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = _mix(0, 255, avg + SHIFT);
        data[i + 1] = avg + SHIFT;
        data[i + 2] = avg + SHIFT;
      }
    };
        
    function _mix(x, y, a) {
      return x * (1 - a) + y * a;
    }

    function _glitch(data) {
      const width = canvas.width * 4;
      const height = canvas.height * 4;
      const glitchedLinesCount = _random(height * .01); 
      const glitchedLines = [];
      for (let i = 0; i < glitchedLinesCount; i++) {
        glitchedLines.push(_random(height));
      }
      for (let line = 0; line < data.length; line += width) {
        const longShift = 4 * _random(1006);
        if (glitchedLines.indexOf(line / width) != -1) {
          for (let i = line; i < line + width; i += 4) {
            data[i] = data[i + longShift] || 0;
            data[i + 1] = data[i + 1 + longShift] || 0;
            data[i + 2] = data[i + 2 + longShift] || 0;
          }
        }
        const shoftShift = 4 * _random(6);
        if (glitchedLines.indexOf(line / width) == -1) {
          for (let i = line; i < line + width; i += 4) {
            data[i] = data[i + shoftShift] || 0;
            data[i + 1] = data[i + 1 + shoftShift] || 0;
            data[i + 2] = data[i + 2 + shoftShift] || 0;
          }
        }
      }
    }
        
    // Helper functions

    function _avg(array) {
      const sum = array.reduce((sum, val) => sum + Math.pow(val, 2));
      return Math.sqrt(sum / array.length);
    }

    function _random(limit) {
      return Math.floor(Math.random() * limit) + 1;
    }

    function _delay(duration) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve();
        }, duration);
      });
    }

    function _isHidden(element) {
      return (element.offsetParent === null)
    }
  });

}());
