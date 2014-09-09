var http=require('http');
var dgram = require("dgram");
var server = dgram.createSocket("udp4");

server.on("message", function (msg, rinfo) {
  var msgLn = msg.readUInt32BE(0);
  var msgPdu = msg.readUInt32BE(4);
  var sessId = msg.readDoubleBE(8);
  var msgSeq = msg.readDoubleBE(16);
  var topicLn = msg.readInt32BE(24);
  var topic = msg.toString('utf8',29,28+topicLn);
  var payload = msg.toString('utf8',36+topicLn);
  payload = payload.replace(/\\'/g,"'");
  payload = payload.replace(/\\\"/g,"'");
  var data = JSON.parse(payload);
  topic = topic.toLowerCase();
  topic = topic.replace("/","_");
  if (!payload || payload.length <= 2 ) return;
  if(topic==='system_summary'){

	//{"alert_count":13504,"service_count":241,"sig_summaries":{"categories":[{"sig_total":47,"alert_total":null,"name":"Closed"},{"sig_total":0,"alert_total":null,"name":"Created"},{"sig_total":431,"alert_total":null,"name":"Detected"},{"sig_total":0,"alert_total":null,"name":"Priority"},{"sig_total":0,"alert_total":null,"name":"Spam"},{"sig_total":0,"alert_total":null,"name":"Superseded"}],"queues":[{"sig_total":453,"alert_total":null,"name":"Uncategorized"},{"sig_total":9,"alert_total":null,"name":"CCW_Apps"},{"sig_total":15,"alert_total":null,"name":"Interesting"},{"sig_total":1,"alert_total":null,"name":"ProductionPriority"}]},"sigs_down":180,"sigs_up":285,"total_events":1067558,"total_sigs":478}

        var systemSummary = JSON.parse(payload);

        var data = {auth_token : AUTH_TOKEN, value : systemSummary.total_sigs};
        postData('totalsituationcount',data);

        data = {auth_token : AUTH_TOKEN, value : systemSummary.total_events};
        postData('totalevents',data);

        data = {auth_token : AUTH_TOKEN, value : systemSummary.alert_count};
        postData('totalalerts',data);

        var detectedSituationCount=0;
        var prioritySituationCount=0;
        var closedSituationCount=0;

        systemSummary.sig_summaries.categories.map(function(category){
		switch(category.name){
			case 'Created':
			detectedSituationCount=category.sig_total;
			break;
                        case 'Priority':
                        prioritySituationCount=category.sig_total;
                        break;
                        case 'Closed':
                        closedSituationCount=category.sig_total;
                        break;
		}
	});

        var ratioOpenClose = (closedSituationCount/systemSummary.total_sigs)*100;

        data = {auth_token : AUTH_TOKEN, current : ratioOpenClose.toFixed(2)};
        postData('rationopenclosedsituations',data);

    }
});

server.on("listening", function () {
  var address = server.address();
});

server.bind(9002);

function postData(widgetName,data){

  options.path = '/widgets/'+widgetName;

  options.headers = {
    'Content-Type': 'application/json',
    'Content-Length': JSON.stringify(data).length
  };

var request = http.request(options, function(response) {
  response.setEncoding('utf8');
  response.on('data', function (chunk) { });
});

request.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});

console.log('posting '+JSON.stringify(data)+ ' to moogboard.'+widgetName);

request.write(JSON.stringify(data));
request.end();

}
