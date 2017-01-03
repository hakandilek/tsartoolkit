import { Component, ViewChild, ElementRef } from '@angular/core';
import { Platform, NavController } from 'ionic-angular';

import { WebGLRenderer, Color, Mesh, MeshNormalMaterial, BoxGeometry, IcosahedronGeometry, FlatShading } from 'three';
import { ARController, ARThreeScene, artoolkit } from 'jsartoolkit5';

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {

    @ViewChild('videoElement') videoElement: ElementRef;

    width: number;
    height: number;
    stream: MediaStream;

    constructor(platform: Platform, public navCtrl: NavController) {
        this.width = 640;//platform.width();
        this.height = 480;//platform.height();
        console.log(`WxH: ${this.width}x${this.height}`);
    }

    ngAfterViewInit() {
        //let videoNative = this.videoElement.nativeElement;
        let vw = this.width;
        let vh = this.height;

        if ('MediaDevices' in window || navigator.getUserMedia) {
            ARController.getUserMediaThreeScene({
                maxARVideoSize: 640,
                cameraParam: 'assets/data/camera_para.dat',
                onSuccess: (arScene: ARThreeScene, arController, arCamera) => {
                    arController.setPatternDetectionMode(artoolkit.AR_TEMPLATE_MATCHING_MONO_AND_MATRIX);

                    var renderer = this.createWebGLRenderer(vw, vh);
                    document.body.appendChild(renderer.domElement);

                    var rotationTarget = 0;
                    renderer.domElement.addEventListener('click', function (ev) {
                        ev.preventDefault();
                        rotationTarget += 1;
                    }, false);


                    let cube = this.createCube();
                    let icosahedron = this.createIcosahedron();
                    this.trackMarker(arScene, arController, 5, cube);
                    this.trackMarker(arScene, arController, 20, icosahedron);

                    let tick = () => {
                        arScene.process();
                        arScene.renderOn(renderer);
                        requestAnimationFrame(tick);
                    };
                    tick();
                }
            });
        }
    }

    private trackMarker(arScene: ARThreeScene, arController, markerId: number, object: Mesh) {
        var marker = arController.createThreeBarcodeMarker(markerId, 1);
        marker.add(object);
        arScene.scene.add(marker);
    }

    private createCube(): Mesh {
        var cube = new Mesh(
            new BoxGeometry(1, 1, 1),
            new MeshNormalMaterial()
        );
        cube.material.shading = FlatShading;
        cube.position.z = 0.5;
        return cube;
    }

    private createIcosahedron(): Mesh {
        var icosahedron = new Mesh(
            new IcosahedronGeometry(0.7, 1),
            new MeshNormalMaterial()
        );
        icosahedron.material.shading = FlatShading;
        icosahedron.position.z = 0.7;
        return icosahedron;
    }

    private createWebGLRenderer(width: number, height: number): WebGLRenderer {
        var renderer = new WebGLRenderer({
            antialias: true,
            alpha: true
        });
        renderer.setClearColor(new Color('lightgrey'), 0)
        renderer.setSize(width, height);
        renderer.domElement.style.position = 'absolute'
        renderer.domElement.style.top = '50%';
        renderer.domElement.style.left = '50%';
        renderer.domElement.style.transform = 'translate(-50%, -50%)';
        renderer.domElement.className = 'center';
        return renderer;
    }
}
