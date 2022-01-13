import React, { Component } from "react";
// import { css } from "@emotion/core";
// import { HashLoader } from "react-spinners";
import "./loader.scss";

export class Loader extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true
    };
  }

  render() {
    return this.state.loading ? (
      <div className="loader-container">
        <div className="loader">
          {/* <div className="inner one"></div>
          <div className="inner two"></div>
          <div className="inner three"></div> */}
          <div className="small_box b1"></div>
          <div className="small_box b2"></div>
          <div className="small_box b3"></div>
          <div className="small_box b4"></div>
          <div className="small_box b6"></div>
          <div className="small_box b7"></div>
          <div className="small_box b8"></div>
          <div className="small_box b9"></div>
        </div>
      </div>
    ) : null;
  }
}

export default Loader;
