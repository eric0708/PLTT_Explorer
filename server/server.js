'use strict'

/////////////////////////////////////////////////////
//////// function and variables for handling clients
/////////////////////////////////////////////////////

var http = require('http');
var server = http.createServer (async function(request,response) {

    console.log("... Connected to Client");
    response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8"});
    
    // "GET" from client
    if (request.method == "GET") {
        
        // Read message from client:
        var params = new URLSearchParams(request.url.substring(2))
        console.log("......  GET request from" + request.connection.remoteAddress + ":" + request.connection.remotePort);
        console.log("FUNCTION  : " + params.get("func"));
        console.log("PARAMETER : " + params.get("para"));
        console.log("......  GET request ended.....");


        // "Using LogNo, search hash from blockchain"
        if (params.get("func") == "lognohash" && !isNaN(params.get("para"))) {
            
            // Ask blockchain server
            var reply = await search_by_logno(params.get("para")).then();
            
            // Send respone to client
            response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            response.write("<head><style>body{ font-family: Arial; font-size: 60% }</style></head>");
            response.write("<pre id='json'></pre>")
            response.write("<script type='text/javascript'>");
            response.write("var data = " + reply + ";");
            response.write("document.getElementById('json').innerHTML = JSON.stringify(data, undefined, 2);");
            response.write("</script>");
            response.end();
        }

        // "Using LogNo, search content from https://fc.efoodex.net/"
        else if (params.get("func") == "lognoctx" && !isNaN(params.get("para"))) {

            // Redirect user to efoodex
            response.writeHead(301,
                { Location: "https://fc.efoodex.net/portal.php?oid=" + params.get("para")}
            );
            response.end();
        }
        
        // "Using LogNo, search content from offline csv
        else if (params.get("func") == "lognotxn" && !isNaN(params.get("para"))) {
            
            // Call function for searching
            const reply = await search_by_logno_offline(params.get("para")).then();

            // Format the content to JSON
            const ctx = JSON.parse(reply);
            const ctx_activities = ctx[2].split(",")
            const ctx_gps = ctx[3].split(",")
            const ctx_county = ctx[4]

            var ctx_gps_lat = []
            var ctx_gps_lng = []
            var k;
            for (k = 0; k < ctx_gps.length; k = k + 2) {
                ctx_gps_lat.push(ctx_gps[k].substring(1))
                ctx_gps_lng.push(ctx_gps[k+1].slice(0,-1))
            }

            // Send respone to client
            response.writeHead(200, { "Content-Type": "text/html; charset=utf-8"});
            response.write("<head>")
            response.write("<style>body{ font-family: Arial; font-size: 90%; text-align: center}</style>");
            response.write("<script src='http://maps.google.com/maps/api/js?sensor=false&key=AIzaSyCribtv6NVUaIfImUYBp5WCQHjgczOf13E' type='text/javascript'></script>");
            response.write("</head>");
            response.write("<body>");
            response.write("<h3>Log Number " + ctx[0] + "</h3>");
            response.write("<h4>Product's name [產品名稱]: " + ctx[5] + "</h4>");
            response.write("<h4>Producer's name [產出組織]: " + ctx[6] + "</h4>");
            response.write("<h4>Date of production [產出日期]: " + ctx[7] + "</h4>");
            response.write("<h4>Date of expiry [有效日期]: " + ctx[8] + "</h4>");
            response.write("<h4>Quantity of production [產出數量]: " + ctx[9] + "</h4>");
            response.write("<h4>Quantity of remaining [剩餘數量]: " + ctx[10] + "</h4>");
            response.write("<h4>Number of  activities : " + ctx[1] + "</h4>");
            response.write("<h4>County for activities : " + ctx_county + "</h4>");
            response.write("<h4>Names  of  activities : </h4>");
            var i;
            var webpage;
            for (i = 0; i < ctx_activities.length; i++) {
                webpage = "<button class='btn btn-dark btn-lg btn-width' style='margin-top: 5px; word-wrap: break-word;'>" + ctx_activities[i] + "</button>";
                response.write(webpage);
            }
            response.write("<h4>Map locations, if any: </h4>");
            response.write("<div id='map' style='width: 800px; height: 600px;margin-left: auto;margin-right: auto;'></div>");
            response.write("<script type='text/javascript'>");
            response.write("var map = new google.maps.Map(document.getElementById('map'), {zoom: 8,center: new google.maps.LatLng(" + ctx_gps_lat[0] + "," + ctx_gps_lng[0] + "),mapTypeId: google.maps.MapTypeId.ROADMAP});");
            response.write("var infowindow = new google.maps.InfoWindow();");
            response.write("var marker;");

            for (i = 0; i < ctx_gps_lat.length; i++) {
                response.write("marker = new google.maps.Marker({position: new google.maps.LatLng(" + ctx_gps_lat[i] + ", " + ctx_gps_lng[i] + "),map: map});");
            }
            response.write("</script>");
            response.write("</body>");
            response.write("<br><p>.</p>");
            response.end();
        }
            
        // "Using Location, search LogNo happens in the location from offline csv
        else if (params.get("func") == "location") {
            
            // Call function for searching
            const reply = await search_by_location_offline(params.get("para")).then();

            // Format the log number to integers
            const logno = JSON.parse(reply);

            // Send respone to client
            response.writeHead(200, { "Content-Type": "text/html; charset=utf-8"});
            response.write("<head><style>body{ font-family: Arial; font-size: 90%; text-align: center } table, th, td {border: 1px solid black;margin-left: auto;margin-right: auto;}</style></head>");
            response.write("<h3>Below transactions are occured at " + params.get("para") + "</h3>");
            var i;
            var webpage;
            response.write("<table>");
            response.write("<tr align='center'>");
            response.write("<th colspan='20'><b>LOG NUMBERS</b></th>");
            response.write("</tr>");
            for (i = 0; i < logno.length; i++) {
            	if (i%20 == 0){
            		response.write("<tr>")
            	}
                webpage = "<td style='text-align:center'><a href='https://fc.efoodex.net/portal.php?oid=" + logno[i] + "' target='_blank'>" + logno[i] + "</a></td>";
                response.write(webpage);
                if (i%20 == 19){
            		response.write("</tr>")
            	}
            }
            
            response.end();
        }

        // Check the latest changes of blockchain
        else if (params.get("func") == "dashboard") {
          
            var basic_info = await search_basic_info().then()
            basic_info = JSON.parse(basic_info)
            
            // DASHBLOCK - Lastest blocks
            response.writeHead(200, { "Content-Type": "text/html; charset=utf-8"});
            response.write("<head><style>body{ font-family: Arial; text-align: center} table, th, td {border: 1px solid black;margin-left: auto;margin-right: auto;}</style></head>");
            response.write("<h1>Dashboard</h1>");
            response.write("<h3>Connected to blockchain at node: http://foodchain-node1.etherhost.org:22001 </h3>");
            response.write("<h3>Contract address is " + CONTRACT_ADDRESS + "</h3>");
            response.write("<p>Total numbers for blocks = " + basic_info['blockNumber'] + "</p>");
            response.write("<p>Coinbase : " + basic_info['coinbase'] + "</p>");
            response.write("<p>Is mining? " + basic_info['mining'] + "</p>");


            response.write("<h3>Recent blocks:</h3>");
            response.write("<table>");
            response.write("<tr align='left'>");
            response.write("<th><b>TIME</b></th>");
            response.write("<th><b>BLOCK</b></th>");
            response.write("</tr>");

            // Send 2nd latest block
            var reply = await search_previous_block().then();
            reply = JSON.parse(reply)
            response.write("<tr>");
            response.write("<td style='text-align:left;vertical-align:top'> Latest Block minus 3 </td>");
            response.write("<td style='text-align:left;vertical-align:top'>");
            response.write("<i>Number    : </i>" + reply['number'][2] + "<br>");
            response.write("<i>Timestamp : </i>" + reply['timestamp'][2] + "<br>");
            response.write("<i>Parent Hash  : </i>" + reply['parentHash'][2] + "<br>");
            response.write("<i>Current Hash : </i>" + reply['hash'][2] + "<br>");
            response.write("<i>Transactions Root : </i>" + reply['transactionsRoot'][2] + "<br>");
            response.write("<i>Transactions Hash : </i>" + reply['transactions'][2] + "<br>");
            response.write("<br>");
            response.write("</td>");
            response.write("</tr>");
            response.write("<tr>");
            response.write("<td style='text-align:left;vertical-align:top'> Latest Block minus 2 </td>");
            response.write("<td style='text-align:left;vertical-align:top'>");
            response.write("<i>Number    : </i>" + reply['number'][1] + "<br>");
            response.write("<i>Timestamp : </i>" + reply['timestamp'][1] + "<br>");
            response.write("<i>Parent Hash  : </i>" + reply['parentHash'][1] + "<br>");
            response.write("<i>Current Hash : </i>" + reply['hash'][1] + "<br>");
            response.write("<i>Transactions Root : </i>" + reply['transactionsRoot'][1] + "<br>");
            response.write("<i>Transactions Hash : </i>" + reply['transactions'][1] + "<br>");
            response.write("<br>");
            response.write("</td>");
            response.write("</tr>");
            response.write("<tr>");
            response.write("<td style='text-align:left;vertical-align:top'> Latest Block minus 1 </td>");
            response.write("<td style='text-align:left;vertical-align:top'>");
            response.write("<i>Number    : </i>" + reply['number'][0] + "<br>");
            response.write("<i>Timestamp : </i>" + reply['timestamp'][0] + "<br>");
            response.write("<i>Parent Hash  : </i>" + reply['parentHash'][0] + "<br>");
            response.write("<i>Current Hash : </i>" + reply['hash'][0] + "<br>");
            response.write("<i>Transactions Root : </i>" + reply['transactionsRoot'][0] + "<br>");
            response.write("<i>Transactions Hash : </i>" + reply['transactions'][0] + "<br>");
            response.write("<br>");
            response.write("</td>");
            response.write("</tr>");

            // Function for sending blocks to client
            function show_new_blocks() {

                var respone_count = 0;
                
                // Send response for every 5 seconds.
                var interval = setInterval(async function () {
                    
                    // Call function for searching
                    var reply = await search_latest_block().then();
                    reply = JSON.parse(reply)
                    
                    // Show send the lastest block to client
                    var time_now = new Date()
                    response.write("<tr>");
                    response.write("<td style='text-align:left;vertical-align:top'>" + time_now.toLocaleString("en-GB") + "</td>");
                    response.write("<td style='text-align:left;vertical-align:top'>");
                    response.write("<i>Number    : </i>" + reply['number'] + "<br>");
                    response.write("<i>Timestamp : </i>" + reply['timestamp'] + "<br>");
                    response.write("<i>Parent Hash  : </i>" + reply['parentHash'] + "<br>");
                    response.write("<i>Current Hash : </i>" + reply['hash'] + "<br>");
                    response.write("<i>Transactions Root : </i>" + reply['transactionsRoot'] + "<br>");
                    response.write("<i>Transactions Hash : </i>" + reply['transactions'] + "<br>");
                    response.write("<br>");
                    response.write("</td>");
                    response.write("</tr>");
                    
                    // Terminate after 10 blocks are sent.
                    respone_count += 1;
                    if (respone_count == 10) {
                        clearInterval(interval)
                        response.write("</table>");
                        response.end("<p>Timeout. Please refresh the page.</p>")
                    }

                }, 5000);

            }

            // Sending blocks to client
            show_new_blocks();

        }
            
        // Unknown function from client
        else {
            const reply = "Error, and your request is: " + params.get("func") + " " + params.get("para");
            response.end(reply);
        }

    }
    
    // UNKNOWN REQUEST from client
    else {
        const reply = "Undefined request.";
        response.end(reply);
    }

});

/////////////////////////////////////////////////////
//////// function and variables for online blockchain
/////////////////////////////////////////////////////


// Define blockchain address
const Web3 = require('web3');
const quorumjs = require('quorum-js');
const web3 = new Web3('http://foodchain-node1.etherhost.org:22001');
const CONTRACT_ADDRESS = '0xA4fafbE0ea4823e262b4916EF93CC5A6306A5DBc';
quorumjs.extend(web3);

// Read smart contract ABI
const fs = require('fs');
const food3_abi = fs.readFileSync('food3.abi', 'utf-8');
const CONTRACT_ABI = JSON.parse(food3_abi);


// Function for search blockchain by logno
async function search_by_logno(num) {
    
    // Connect to the blockchain network for contract
    const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    
    // Return events by logno.
    const result = await contract.getPastEvents('FoodSection', {
        filter: { logno: num },
        fromBlock: 0,
    });

    // Serialized result to JSON, and return
    const serialized_record = JSON.stringify(result);
    return serialized_record;

}

// Function to get latest block from blockchain
async function search_latest_block() {

    // Get block number of latest block
    const latest = await web3.eth.getBlockNumber();


    // Return events by logno.
    const result = await web3.eth.getBlock(latest);

    const return_value = {
        'number': result['number'],
        'timestamp': result['timestamp'],
        'parentHash': result['parentHash'],
        'hash': result['hash'],
        'transactionsRoot': result['transactionsRoot'],
        'transactions': result['transactions']
    }

    // Serialized result to JSON, and return
    const serialized_record = JSON.stringify(return_value);
    return serialized_record;

}

async function search_previous_block() {

    // Get block number of latest block
    const latest = await web3.eth.getBlockNumber();


    // Return events by logno.
    const result1 = await web3.eth.getBlock(latest - 1);
    const result2 = await web3.eth.getBlock(latest - 2);
    const result3 = await web3.eth.getBlock(latest - 3);

    const return_value = {
        'number': [result1['number'], result2['number'], result3['number']],
        'timestamp': [result1['timestamp'], result2['timestamp'], result3['timestamp']],
        'parentHash': [result1['parentHash'], result2['parentHash'], result3['parentHash']],
        'hash': [result1['hash'], result2['hash'], result3['hash']],
        'transactionsRoot': [result1['transactionsRoot'], result2['transactionsRoot'], result3['transactionsRoot']],
        'transactions': [result1['transactions'], result2['transactions'], result3['transactions']]
    }

    // Serialized result to JSON, and return
    const serialized_record = JSON.stringify(return_value);
    return serialized_record;

}

// Function to return basic information of blockchain
async function search_basic_info() {

    // Get information
    const coinbase = await web3.eth.getCoinbase();
    const mining = await web3.eth.isMining();
    const hashrate = await web3.eth.getHashrate();
    const gasPrice = await web3.eth.getGasPrice();
    const blockNumber = await web3.eth.getBlockNumber();


    const return_value = {
        'coinbase': coinbase,
        'mining': mining,
        'hashrate': hashrate,
        'gasPrice': gasPrice,
        'blockNumber': blockNumber
    }

    // Serialized result to JSON, and return
    const serialized_record = JSON.stringify(return_value);
    return serialized_record;

}

/////////////////////////////////////////////////////
//////// function and variables for offline blockchain
/////////////////////////////////////////////////////

// Read csv file (= offline data)
const papa = require("papaparse");
const { scripts } = require('min-document');
const datacsv_location = fs.readFileSync("offlinedata/result_location.csv", 'utf-8');
const dataarray_location = papa.parse(datacsv_location).data;
const datacsv_producer = fs.readFileSync("offlinedata/result_producer.csv", 'utf-8');
const dataarray_producer = papa.parse(datacsv_producer).data;

// Function for search transaction in certain location
async function search_by_location_offline(place) {

    // Find record in the place
    const place_ind = dataarray_location[0].indexOf(place);
    var result = [];

    var i;
    for (i = 1; i < dataarray_location.length; i++){
        if (dataarray_location[i][place_ind] == 'true') {
            result.push(dataarray_location[i][0]);
        }
    }

    // Serialized result to JSON, and return
    const serialized_record = JSON.stringify(result);
    return serialized_record;

}

// Function for search content of certain logno
async function search_by_logno_offline(logno) {

    // Find content of a logno
    var result = [];

    var i
    for (i = 1; i < dataarray_location.length; i++){
        if (dataarray_location[i][0] == logno) {
            result = [dataarray_location[i][0], dataarray_location[i][1], dataarray_location[i][2], dataarray_location[i][3], dataarray_location[i][4]]
        }
    }
    if (result.length < 4) {
        result = ['no record', 'no record', 'no record', '(0,0)', 'no record']
    }

    if (result[3] == '""') {
        result[3] = '(0,0)'
        result[4] = 'no record'
    }

    var j
    for (j = 1; j < dataarray_producer.length; j++){
        if (dataarray_producer[j][0] == logno) {
            result = result.concat([dataarray_producer[j][1], dataarray_producer[j][2], dataarray_producer[j][3], dataarray_producer[j][4], dataarray_producer[j][5], dataarray_producer[j][6]]);
        }
    }

    if (result.length < 10) {
        result = result.concat(['no record', 'no record', 'no record', 'no record', 'no record', 'no record']);
    }

    // Serialized result to JSON, and return
    const serialized_record = JSON.stringify(result);
    return serialized_record;

}


/////////////////////////////////////////////////////
//////// Finally, run the server
/////////////////////////////////////////////////////

server.listen(8001);
console.log("Server running on port 8001");