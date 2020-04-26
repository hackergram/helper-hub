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

function updateData(datajson, searchkey){
  console.log(datajson)
  var datajson2={"locations":{},groups:[]}
  //let locationArray = Object.keys(datajson.locationData.locations);
  datajson.datalayers.forEach(layer=>{
    //console.log(layer)
    layer.forEach(item=>{
  //    console.log(item)
      if(searchkey==="" || item.text.toLowerCase().includes(searchkey.toLowerCase())){
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
      }

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
  const [fetchData, setFetchData] = useState({});
  const [allData, setAllData]=useState({locations:{},groups:[]});
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const desktopSize = 1024;
  const [searchQuery,setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);


  useEffect(()=> {
    fetchJSON()
      .then(res => {
        console.log(res);
        setAllData(updateData(res,""));
        console.log(allData)
        setFetchData(res);
      })
      .catch(err => console.log(err))
  },[])


  //const onChangeSearch = query => setVideoData(videoData);
  const onChangeSearch = item => {
    console.log(item.target.value)
    var filterresult=updateData(fetchData,item.target.value)
    setAllData(filterresult);
  }

  const onMarkerClick = (e, location) => {
    e.preventDefault();
    if(location){window.location.hash = location; window.scrollTo({top: 0, left: 0, behavior: 'smooth'})}
    else{window.location.hash = ""}
    if(selectedLocation !== location) {
      setSelectedLocation(location);
    }
  }

  const handleAboutClicked = () => {
    window.location.hash = "about"
    setIsAboutOpen(true);
  }

  const handleAboutClose = () => {
    window.location.hash = "/"
    setIsAboutOpen(false);
  }
  const onCityDetailClose = (e) => {
    e && e.preventDefault();
    setSelectedLocation(null)
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

      <MapLayer className="mapLayer" onMarkerClick={onMarkerClick} videoData={allData.locations} totalLocations={Object.keys(allData.locations)} groups={allData.groups} desktopSize={desktopSize}/>
      {selectedLocation && <CityDetailView selectedCity={selectedLocation} videoData={allData.locations}  groups={allData.groups} onCityDetailClose={onCityDetailClose} desktopSize={desktopSize} />}

      {Object.keys(allData.locations).map(key=>{
        return(
          <div>
            <h2>{key}</h2>
            {Object.keys(allData.locations[key].items).map(key1=>{
              return(
                <div>
                <h3>{key1}</h3>
                {allData.locations[key].items[key1].map(item=>{
                  return (
                    <p>{JSON.stringify(item)}</p>
                  )
                })}

                </div>
              )
            })}
          </div>
        )
      })}
    </div>

  )
}
export default App;
