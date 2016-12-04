import { Component, ViewChild, ElementRef } from '@angular/core';
import { Platform, NavController } from 'ionic-angular';

import { ARController, ARCameraParam } from 'jsartoolkit5';
import { WebGLRenderer, Color, Scene, Camera, Object3D, CubeGeometry, MeshNormalMaterial, Mesh, TorusKnotGeometry, DoubleSide } from 'three';

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
        let vw = videoNative.width;
        let vh = videoNative.height;

        // init renderer
        var renderer = new WebGLRenderer({
            antialias: true,
            alpha: true
        });
        renderer.setClearColor(new Color('lightgrey'), 0)
        renderer.setSize(vw, vh);
        renderer.domElement.style.position = 'absolute'
        renderer.domElement.style.left = '8px'
        document.body.appendChild(renderer.domElement);
        // array of functions for the rendering loop
        var onRenderFcts = [];
        // init scene and camera
        var scene = new Scene();

        // Create a camera and a marker root object for your Three.js scene.
        var camera = new Camera();
        camera.matrixAutoUpdate = false;
        scene.add(camera);


        var arController = null;
        // load camera parameters
        var cameraParameters = new ARCameraParam();
        cameraParameters.onload = () => {
            arController = new ARController(vw, vh, cameraParameters);
            //arController.debugSetup();
            var cameraMatrix = arController.getCameraMatrix();
            camera.projectionMatrix.elements.set(cameraMatrix);
        };
        cameraParameters.load('assets/data/camera_para.dat');

        // create the marker Root
        var markerRoot = new Object3D();
        var markerMatrix = new Float64Array(12);
        markerRoot.matrixAutoUpdate = false;
        markerRoot.visible = false
        scene.add(markerRoot);

        onRenderFcts.push(() => {
            if (!arController) return;
            arController.detectMarker(videoNative);
            //arController.debugDraw();
            // update markerRoot with the found markers
            var markerNum = arController.getMarkerNum();
            if (markerNum > 0) {
                if (markerRoot.visible === false) {
                    arController.getTransMatSquare(0 /* Marker index */, 1 /* Marker width */, markerMatrix);
                } else {
                    arController.getTransMatSquareCont(0, 1, markerMatrix, markerMatrix);
                }
                arController.transMatToGLMat(markerMatrix, markerRoot.matrix.elements);
            }
            // objects visible IIF there is a marker
            if (markerNum > 0) {
                markerRoot.visible = true;
            } else {
                markerRoot.visible = false;
            }
        });

        // add a torus knot	in the scene
        var geometry = new CubeGeometry(1, 1, 1);
        var material = new MeshNormalMaterial({
            transparent: true,
            opacity: 0.5,
            side: DoubleSide
        });
        var mesh = new Mesh(geometry, material);
        mesh.position.z = geometry.parameters.height / 2
        markerRoot.add(mesh);

        var geometry2 = new TorusKnotGeometry(0.3, 0.1, 32, 32);
        material = new MeshNormalMaterial();
        mesh = new Mesh(geometry2, material);
        mesh.position.z = 0.5
        markerRoot.add(mesh);

        onRenderFcts.push(() => {
            mesh.rotation.x += 0.1
        });

        // render the scene
        onRenderFcts.push(() => {
            renderer.render(scene, camera);
        });

        // run the rendering loop
        var lastTimeMsec = null
        requestAnimationFrame(function animate(nowMsec) {
            // keep looping
            requestAnimationFrame(animate);
            // measure time
            lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60
            var deltaMsec = Math.min(200, nowMsec - lastTimeMsec)
            lastTimeMsec = nowMsec
            // call each update function
            onRenderFcts.forEach((onRenderFct) => {
                onRenderFct(deltaMsec / 1000, nowMsec / 1000)
            })
        })

    }

}
