import { Component, ViewChild, ElementRef } from '@angular/core';
import { Platform, NavController } from 'ionic-angular';

import { ARController } from 'jsartoolkit5';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  @ViewChild('videoElement') videoElement: ElementRef;
  @ViewChild('canvasElement') canvasElement: ElementRef;
  width: number;
  height: number;

  constructor(platform: Platform, public navCtrl: NavController) {
    this.width = platform.width();
    this.height = platform.height();
  }

  ngAfterViewInit() {
    let videoNative = this.videoElement.nativeElement;
    let canvasNative = this.canvasElement.nativeElement;
    let ctx = canvasNative.getContext('2d');
    console.log(`video  : ${videoNative}`);
    console.log(`canvas : ${canvasNative}`);
    console.log(`context: ${ctx}`);
    let vw = videoNative.width;
    let vh = videoNative.height;

    let arController = new ARController(vw, vh, `assets/data/camera_para.dat`);
    arController.onload = () => {
      arController.debugSetup();
      setInterval(() => {
        arController.process(videoNative);
      }, 13);
    };
  }

}
