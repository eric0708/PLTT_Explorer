import React, { Component } from 'react';
import bgimage from './img/farm.jpg'
import {
  Container, 
  Navbar, 
  NavbarBrand,
  Row,
  Col,
  Jumbotron
} from 'reactstrap';

class App extends Component {
  constructor() {
    super()
    this.state = {
      func: '',
      para: '',
      resp: ''
    }

    this.handleClick = this.handleClick.bind(this)
    this.handlefuncChange = this.handlefuncChange.bind(this)
    this.handleparaChange = this.handleparaChange.bind(this)
  }

  handleClick(){
    fetch(`https://localhost:8001?func=${encodeURIComponent(this.func)}&para=${encodeURIComponent(this.para)}`, {method: "GET"})
    .then(res => res.json())
    .then(res => {
      this.setState({res:res})
    })
  }

  handlefuncChange(event){
    this.setState({func: event.target.value})
  }

  handleparaChange(event){
    this.setState({para: event.target.value})
  }

  handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.target);
    
    fetch('https://localhost:8001', {
      method: 'GET',
      body: data,
    })
    .then(function(response) {
      console.log(response)
      console.log(response.json())
      return response.json();
    });
  }

  render(){
    return (
      <Container fluid className="centered">
        <Navbar className="navbar navbar-expand-lg navbar-dark bg-primary" light expand="md">
          <NavbarBrand>PLTT Explorer</NavbarBrand>
        </Navbar>
        <Row>
          <Col>
            <Jumbotron style={{ backgroundImage: `url(${bgimage})`, backgroundSize: 'cover'}}>
              <h1 className="display-3">PLTT Explorer</h1>
              <p className="lead" style={{fontWeight: "bold"}}>Explore and Visualize PLTT Blockchain Events</p>
              <br></br>
              <br></br>
              <form className="form-group" action="http://localhost:8001/" method="GET" target="mainFrame">
                <label htmlFor="func" style={{ color: 'white', fontSize:24, fontWeight: "bold"}}>Search By</label>
                <select className="form-control form-select" name="func" id="func">
                  <option value="dashboard">Dashboard</option>
                  <option value="lognoctx">Log Number (To 'efoodex')</option>
                  <option value="lognohash">Log Number (Get Hash)</option>
                  <option value="lognotxn">Log Number (Get Activities)</option>
                  <option value="location">Location (Get Log Number)</option>
                </select>
                <br></br>
                <br></br>
                <label htmlFor="para" style={{ color: 'white', fontSize:24, fontWeight: "bold"}}>Parameter</label>
                <br></br>
                <input placeholder="Enter a Log Number or select a location" className="form-control form-select" list="para" name="para" autoComplete="off"/>
                <datalist id="para">
                  <option value="台北"/>
                  <option value="新北"/>
                  <option value="台中"/>
                  <option value="台南"/>
                  <option value="基隆"/>
                  <option value="高雄"/>
                  <option value="新竹"/>
                  <option value="嘉義"/>
                  <option value="苗栗"/>
                  <option value="彰化"/>
                  <option value="南投"/>
                  <option value="雲林"/>
                  <option value="屏東"/>
                  <option value="宜蘭"/>
                  <option value="花蓮"/>
                  <option value="台東"/>
                </datalist>
                <br></br>
                <br></br>
                <button className="btn btn-primary">Send Request</button>
              </form>
            </Jumbotron>
          </Col>
        </Row>
        <Row>
          <Col>
            <iframe frameBorder="0" name="mainFrame"/>
          </Col>
        </Row>
        
        
      </Container>
    );
  } 
}

export default App;
