import React, {useState, useEffect} from 'react';
import Firebase from 'firebase';
import {PageView, initGA} from './Tracking';
import {MapLayer} from './MapLayer.js';
import {CityDetailView} from './CityDetailView.js';

//import {SubmitForm} from './SubmitForm.js';
//import {IntroScreen} from './IntroScreen';
import {About} from './About'
import {SecNav} from './SecNav.js'
import './CSS/App.css'

function get_filter(datajson,searchkey){
  var datajson2={"locations":{},totalItems:0}
  Object.keys(datajson.locations).forEach(function(key){
    datajson2.locations[key]={"items":[], "coordinates":datajson.locations[key].coordinates}
    datajson2.locations[key].items = datajson.locations[key].items.filter(function(item){
      return item.textsearch.includes(searchkey.toLowerCase())
    })
  })
  var count=0
  Object.keys(datajson2.locations).forEach(function(location){
    count=count+datajson2.locations[location].items.length
    if(datajson2.locations[location].items.length==0){
      delete datajson2.locations[location]
    }
  })
  datajson2.totalItems=count
  return datajson2
}

function updateData(datajson, searchkey){
  console.log(datajson)
  var datajson2={"locations":{},groups:[]}
  //let locationArray = Object.keys(datajson.locationData.locations);
  datajson.datalayers.forEach(layer=>{
    //console.log(layer)
    layer.forEach(item=>{
  //    console.log(item)
      //if(item.text.includes(searchkey.toLowerCase())){
        if(!datajson2.groups.includes(item.group)){
          datajson2.groups.push(item.group);
        }
        if(!Object.keys(datajson2.locations).includes(item.location)){
          datajson2.locations[item.location]={coordinates:datajson.locations[item.location].coordinates, items:{}}
        }
        if(!Object.keys(datajson2.locations[item.location].items).includes(item.group)){
          datajson2.locations[item.location].items[item.group]=[]
        }
        datajson2.locations[item.location].items[item.group].push(item);
      //}

    })
  })

  return datajson2
}

const fetchJSON = async() => {

  const res = await fetch('/getLocationData');
  if(res.status !== 200) throw Error(res.message)
  const ld = await res.json();

  const res2 = await fetch('/getData/sampledata');
  if(res2.status !== 200) throw Error(res2.message)
  const sampleData = await res2.json();


  return {"locations":ld.locations, datalayers:[sampleData]};
}



const config = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID
}

function App() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationData, setLocationData] = useState({});
  const [totalLocations, setTotalLocations] = useState([]);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const desktopSize = 1024;
  const [searchQuery,setSearchQuery] = useState("");
  const [result, setResult] = useState({});
  useEffect(()=> {
    fetchJSON()
      .then(res => {
        console.log(res)
        //let locationData=res.locations
        //setLocationData(locationData);
        let xdata=updateData(res,"")
        console.log(xdata)
        let locationData = xdata.locations

        setLocationData(xdata.locations)
        setResult(res)
        console.log(locationData)
        let locationArray = Object.keys(locationData);
        let urlLocation = window.location.href
        let hashLocation = urlLocation.split('#')[1];
        if(hashLocation !== undefined && hashLocation.length>1) {
          let formattedHashLocation = hashLocation.charAt(0).toUpperCase() + hashLocation.slice(1);
          if(locationArray.indexOf(formattedHashLocation) !== -1) {
            setSelectedLocation(formattedHashLocation);
          }
        }
        setTotalLocations(locationArray);
        console.log(locationArray)
        ;
      })
      .catch(err => console.log(err))



  },[])

  const onNewLinkSubmit = (newData) => {
    let newPostKey = Firebase.database().ref('/').push();
    newPostKey.set(newData);
  }

  const onMarkerClick = (e, location) => {
    e.preventDefault();
    if(location){window.location.hash = location; window.scrollTo({top: 0, left: 0, behavior: 'smooth'})}
    else{window.location.hash = ""}
    if(selectedLocation !== location) {
      setSelectedLocation(location);
    }
  }

  const onCityDetailClose = (e) => {
    e && e.preventDefault();
    setSelectedLocation(null)
  }

  const handleAboutClicked = () => {
    window.location.hash = "about"
    setIsAboutOpen(true);
  }

  const handleAboutClose = () => {
    window.location.hash = "/"
    setIsAboutOpen(false);
  }

  //const onChangeSearch = query => setVideoData(videoData);
  const onChangeSearch = item => {
    console.log(item.target.value)
    var filterresult=updateData(result,item.target.value)
    setLocationData(filterresult.locations)
    setTotalLocations(Object.keys(filterresult.locations))
    setSelectedLocation(null)
    console.log(locationData)
  }

  return (
    <div className="app">
      <div className="searchbar">
      <form>
        Search by text: <input type="text" name="searchQuery" onChange={onChangeSearch.bind(searchQuery)}></input>
      </form>
      </div>
      {isAboutOpen && <About handleAboutClose={handleAboutClose} desktopSize={desktopSize} />}

      <SecNav handleAboutClicked = {handleAboutClicked}/>
      <MapLayer className="mapLayer" onMarkerClick={onMarkerClick} videoData={locationData} totalCities={totalLocations} desktopSize={desktopSize}/>
      {selectedLocation && <CityDetailView selectedCity={selectedLocation} videoData={locationData}  onCityDetailClose={onCityDetailClose} desktopSize={desktopSize} />}
      </div>)
}

export default App;
