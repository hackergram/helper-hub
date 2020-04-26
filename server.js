let express = require('express');
let bodyParser = require('body-parser');
let fs = require('fs');
let request = require('request');
const path = require('path');
const Tabletop = require('tabletop'); //arjunvenkatraman added to load data from Google Sheets directly
const app = express();
const port = process.env.PORT || 5000;
const textfields = ['Name', 'Location']
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
const datasheets={
  sampledata: {url:"https://docs.google.com/spreadsheets/d/1k95t4dfCECYsMAgt6hDk8zJdCcXlDNdoama_qd5DqNk/edit#gid=1039939066", wsname:"Published"},
  coronadata: {url:"https://docs.google.com/spreadsheets/d/1IMEwEzT3FwMNCwHpdyotDSZIF1-icQnd9ET7C53v2Z0/edit#gid=0", wsname:"Sheet1"}
}
// const publicSpreadsheetUrl =
// const overlay1data = "https://docs.google.com/spreadsheets/d/1IMEwEzT3FwMNCwHpdyotDSZIF1-icQnd9ET7C53v2Z0/edit#gid=0"
// Datasource check with datasrc var

app.get('/getData/:sheet/:format?', async (req, res) => {
    console.log(req.params.sheet)
    let revisedJSON = await getSheetData(req.params.sheet,req.params.format);

    //fs.writeFileSync('./RawData/VideoData.json', JSON.stringify(revisedJSON, null, 2))
    console.log("Sending Sheet Response")
    res.send(revisedJSON)
})

app.get('/getLocationData', async (req, res) => {

    let revisedJSON = await getLocationSheetData();
    console.log("Sending Sheet Response")
    res.send(revisedJSON)


})


app.get('/getCoronaData', async (req, res) => {
    locationdata = await getLocationSheetData()
    console.log(locationdata)
    let revisedJSON = await getCoronaSheetData();
    console.log(revisedJSON, locationdata)
    Object.keys(locationdata.locations).forEach(function(state){
      locationdata.locations[state].coronacount=Number(revisedJSON[state.toUpperCase()])
    })
    console.log("Sending Sheet Response")
    res.send(locationdata)


})



// Pulling from Google Sheets with Tabletop
function getSheetData(sheetkey, format="json") {
    console.log(sheetkey)
  return new Promise((resolve) => {
    Tabletop.init({
      key: datasheets[sheetkey].url,
      callback: function(data, tabletop) {

        resolve(processSheetData2(tabletop, datasheets[sheetkey].wsname, format));
      },
      simpleSheet: false
    })
  })
}

function getLocationSheetData() {
  return new Promise((resolve) => {
    Tabletop.init({
      key: datasheets.sampledata.url,
      callback: function(data, tabletop) {
        resolve(processLocationSheetData(tabletop));
      },
      simpleSheet: false
    })
  })
}


// Pulling from Google Sheets with Tabletop
function getCoronaSheetData() {
  return new Promise((resolve) => {
    Tabletop.init({
      key: overlay1data,
      callback: function(data, tabletop) {
        resolve(processCoronaSheetData(tabletop));
      },
      simpleSheet: false
    })
  })
}


function get_text_field(item) {
  var text="";
  textfields.forEach(function(key){
    text=text+" "+item[key]
  });
  return text;
}


//Cleaning up the sheet data
function processSheetData2(tabletop,wsname,format="json") {
  console.log(wsname, format)
  let data={}
  if (tabletop.models[wsname]) {
    if (format==="json"){
      data = tabletop.models[wsname].elements;
      data.forEach(item => {
        text=""
        Object.keys(item).forEach(key=>{
          text = text + " " + item[key]
        })
        item['text']=text
      })
    }
    else{
      data = tabletop.models[wsname].toArray();
    }

    newjson = data;
    return (newjson);
  }
  else {
    console.log(`No sheet called ${approvedSheetName}`)
    return (`No sheet is called ${approvedSheetName}`)
  }
}





//Cleaning up the sheet data
function processCoronaSheetData(tabletop) {
  if (tabletop.models["Sheet1"]) {
    let data = tabletop.models["Sheet1"].toArray();
    console.log(data)
    keys=Object.keys(data[0])
    console.log(keys)
    let newjson = {}
    data.map(currentline => {
      state=currentline[1]
      coronacases=currentline[2]
      newjson[state]=coronacases

    })
    console.log(newjson)
    return (newjson)
  }
  else {
    console.log(`No sheet called ${approvedSheetName}`)
    return (`No sheet is called ${approvedSheetName}`)
  }
}

//Cleaning up the sheet data
function processLocationSheetData(tabletop) {
  if (tabletop.models["geolocation"]) {
    let data = tabletop.models["geolocation"].elements;
    console.log(data)
    keys=Object.keys(data[0])
    console.log(keys)
    let newjson = {"locations":{}}
    data.map(currentline => {
      location=currentline['location']
      lat=currentline['lat']
      lng=currentline['lng']
      newjson.locations[location]={"coordinates":{"latitude":lat, "longitude":lng}}

    })
    console.log(newjson)
    return (newjson)
  }
  else {
    console.log(`No sheet called ${approvedSheetName}`)
    return (`No sheet is called ${approvedSheetName}`)
  }
}

if (process.env.NODE_ENV === 'production') {
  // Serve any static files
  app.use(express.static(path.join(__dirname, 'client/build')));

  // Handle React routing, return all requests to React app
  app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

app.listen(port, () => console.log(`Listening on port: ${port}`));

// function buildUrl(url, parameters) {
//     return new Promise((resolve, reject) => {
//         let qs = "";
//         for (const key in parameters) {
//             if (parameters.hasOwnProperty(key)) {
//                 const value = parameters[key];
//                 qs +=
//                     encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
//             }
//         }
//         if (qs.length > 0) {
//             qs = qs.substring(0, qs.length - 1); //chop off last "&"
//             url = url + "?" + qs;
//         }
//         console.log(url);
//         resolve(url);
//     })
// }
