var searchText,
    output,
    affinityToken,
    viewingSessionId;

$("document").ready(function(){
    $("#upload").change(function() {
        output = document.getElementById('output');
        $('#waitText').show();
        $('#viewer').hide();
         postWorkfile();
    });
});

function postWorkfile() {
    console.log('postWorkfile');
    var file = document.getElementById('upload').files[0],
    reader = new FileReader();

    reader.onload = function(e) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://dev-api.accusoft.com/PCCIS/V1/WorkFile', true);
        xhr.setRequestHeader("content-type", 'application/octet-stream');
        xhr.setRequestHeader("acs-api-key", "K5102014151403");

        xhr.onload = function(e) {
            if (this.status == 200) {
                var data = JSON.parse(xhr.response);
                affinityToken = data.affinityToken;
                createViewingSession(function() {
                    postDocumentTextReaders(data.fileId);
                })
            }
        };
        xhr.send(e.target.result);
    };
    reader.readAsArrayBuffer(file);
}

function createViewingSession(callback) {
    console.log('createViewingSession');
    var postData = JSON.stringify(
    {
        "render":{
            "html5":{
                "alwaysUseRaster":false
            }
        }
    });
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://dev-api.accusoft.com/PCCIS/V1/ViewingSession', true);
    xhr.setRequestHeader("content-type", 'application/json');
    xhr.setRequestHeader("acs-api-key", "K5102014151403");

    xhr.onload = function(e) {
      if (this.status == 200) {
        var data = JSON.parse(xhr.response);
        viewingSessionId = data.viewingSessionId;
        callback();
       }
    };
    xhr.send(postData);
}

function postDocumentTextReaders (fileId) {
    console.log('postDocumentTextReaders fileId:'+fileId);
    var postData = JSON.stringify({
        "input": {
            "src": {
                "fileId": fileId
            },
            "dest": {
                "format": "pdf"
            }
        }
    });
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://dev-api.accusoft.com/v1/documentTextReaders', true);
    xhr.setRequestHeader("content-type", 'application/json');
    xhr.setRequestHeader("acs-api-key", "K5102014151403");

    xhr.onload = function(e) {
      if (this.status == 200) {
        var data = JSON.parse(xhr.response);
        getDocument(0, data.processId);
       }
    };
    xhr.send(postData);
}

function getDocument (recurseCnt, processId) {
    console.log('getDocument recurseCnt:'+recurseCnt+' processId:'+processId);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://dev-api.accusoft.com/v1/documentTextReaders/'+processId, true);
    xhr.setRequestHeader("content-type", 'application/json');
    xhr.setRequestHeader("acs-api-key", "K5102014151403");

    xhr.onload = function(e) {
      if (this.status == 200) {
        var data = JSON.parse(xhr.response);
        if(data.state === "processing" && recurseCnt < 481) {
            setTimeout(
              function() {
                recurseCnt++;
                getDocument(recurseCnt, processId);
            }, 500);
        } else if (data.state === "complete") {
            getPdf (data.output.fileId);
        }
       }
    };
    xhr.send();
}

function getPdf (workfileId) {
    console.log('getPdf workfileId:'+workfileId);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://dev-api.accusoft.com/v1/ocrWorkFile/'+workfileId, true);
    xhr.setRequestHeader("Accusoft-Affinity-Hint", affinityToken);
    xhr.setRequestHeader("acs-api-key", "K5102014151403");
    xhr.responseType = 'blob';

    xhr.onload = function(e) {
      if (this.status == 200) {
         putDocuments(xhr.response)
       }
    };

    xhr.send();
}

function putDocuments (file) {
    console.log('putDocuments');
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', 'https://dev-api.accusoft.com/PCCIS/V1/ViewingSession/u'+viewingSessionId+'/SourceFile?FileExtension=dpdf', true);
    xhr.setRequestHeader("acs-api-key", "K5102014151403");
    xhr.onload = function(e) {
      if (this.status == 200) {
        output.data = "http://api.accusoft.com/v1/viewer/?key=K5102014151403&viewingSessionId="+viewingSessionId+"&lowerToolbarColor=cccccc&upperToolbarColor=000000&bottomToolbarColor=ffffff&buttonColor=black&backgroundColor=ffffff&fontColor=ffffff&toolbarHeight=32&cache=no&zoomPercent=100&dropShadow=yes&fullScreenOnInit=no&ssl=no&savebutton=undefined&copyTextButton=undefined&startPage=undefined&hidden=&pagestoshow=undefined&quality=medium&animtype=slide&animduration=450&animspeed=4000&hideAll=false&automatic=yes&showcontrols=yes&centercontrols=yes&keyboardnav=yes&hoverpause=yes"
        document.getElementById('waitText').style.display = 'none';
        document.getElementById('viewer').style.display = 'block';
      }
    };
    xhr.send(file);
}
