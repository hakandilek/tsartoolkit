import { Component, ViewChild, ElementRef } from '@angular/core';
import { Platform, NavController } from 'ionic-angular';

import { ARController, ARCameraParam } from 'jsartoolkit5';
import { WebGLRenderer, Color, Scene, Camera, Object3D, CubeGeometry, MeshNormalMaterial, Mesh, TorusKnotGeometry, DoubleSide } from 'three';

export let CAMERA_TYPE = {
    "FRONT": "facing front",
    "REAR": "facing back"
};

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
        let videoNative = this.videoElement.nativeElement;
        let vw = this.width;
        let vh = this.height;

        if ('MediaDevices' in window || navigator.getUserMedia) {
            console.log(`using ${navigator.getUserMedia}`);
            navigator.mediaDevices.enumerateDevices()
                .then((devices) => {
                    return devices
                        .filter((device) => device.kind === 'videoinput');
                })
                .then((devices) => {
                    navigator.getUserMedia(
                        { video: this.figureOutWhichCameraToUse(devices) },
                        (stream) => {
                            this.stream = stream;
                            let url = window.URL.createObjectURL(stream)
                            console.log(`url: ${url}`);
                            videoNative.src = url;

                            // init renderer
                            var renderer = this.createWebGLRenderer(vw, vh);
                            document.body.appendChild(renderer.domElement);

                            // array of functions for the rendering loop
                            var renderFunctions = [];
                            // init scene and camera
                            var scene = new Scene();

                            // Create a camera and a marker root object for your Three.js scene.
                            var camera = new Camera();
                            camera.matrixAutoUpdate = false;
                            scene.add(camera);

                            var arController: ARController = null;
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

                            renderFunctions.push(() => {
                                if (!arController) return;
                                arController.detectMarker(videoNative);
                                //arController.debugDraw();
                                // update markerRoot with the found markers
                                var markerCount = arController.getMarkerNum();
                                if (markerCount > 0) {
                                    if (markerRoot.visible === false) {
                                        arController.getTransMatSquare(0 /* Marker index */, 1 /* Marker width */, markerMatrix);
                                    } else {
                                        arController.getTransMatSquareCont(0, 1, markerMatrix, markerMatrix);
                                    }
                                    arController.transMatToGLMat(markerMatrix, markerRoot.matrix.elements);
                                    /*
                                    for (let i = 0; i < markerCount; i++) {
                                        let marker = arController.getMarker(i);
                                        let id = marker.id >= 0 ? marker.id : (marker.idPatt >= 0 ? marker.idPatt : (marker.idMatrix));
                                        console.debug(`marker ${id}: ${marker.area}@${marker.pos[0]}x${marker.pos[1]}`);
                                    }
                                    */
                                }
                                // objects visible IIF there is a marker
                                if (markerCount > 0) {
                                    markerRoot.visible = true;
                                } else {
                                    markerRoot.visible = false;
                                }
                            });

                            // add a torus knot	in the scene
                            var mesh = this.add3dObjectInto(markerRoot);

                            //rotate torus
                            renderFunctions.push(() => {
                                mesh.rotation.x += 0.1;
                            });

                            // render the scene
                            renderFunctions.push(() => {
                                renderer.render(scene, camera);
                            });

                            // run the rendering loop
                            //var lastTimeMsec = null;
                            let animate = (nowMsec) => {
                                // keep looping
                                requestAnimationFrame(animate);
                                /*
                                // measure time
                                lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
                                var deltaMsec = nowMsec - lastTimeMsec;
                                this.fps = Math.round(1000 / deltaMsec);
                                lastTimeMsec = nowMsec;
                                //console.log(`fps : ${this.fps}`);
                                */
                                // call each update function
                                renderFunctions.forEach((onRenderFct) => {
                                    onRenderFct();
                                })
                            };
                            requestAnimationFrame(animate);
                        },
                        (e) => console.log('failed', e)
                    );

                })
                .catch((err) => {
                    console.log(err.name + ": " + err.message);
                });
        }

    }

    private figureOutWhichCameraToUse(devices): any {
        console.log(`-> devices: ${JSON.stringify(devices)}`);
        let device = devices
            /*
                .filter((device) => {
                    console.log(`device(${device.kind}): ${device.label} = ${device.deviceId}`);
                    return device.label.indexOf(CAMERA_TYPE.REAR) !== -1
                })
                */
            .pop();

        console.log(`-> device: ${JSON.stringify(device)}`);

        if (device) {
            return { deviceId: device.deviceId ? { exact: device.deviceId } : undefined };
        }
        return true;
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

    private add3dObjectInto(root: Object3D): Mesh {
        var geometry = new CubeGeometry(1, 1, 1);
        var material = new MeshNormalMaterial({
            transparent: true,
            opacity: 0.5,
            side: DoubleSide
        });
        var mesh = new Mesh(geometry, material);
        mesh.position.z = geometry.parameters.height / 2
        root.add(mesh);

        var geometry2 = new TorusKnotGeometry(0.3, 0.1, 32, 32);
        material = new MeshNormalMaterial();
        mesh = new Mesh(geometry2, material);
        mesh.position.z = 0.5;
        root.add(mesh);
        return mesh;
    }
}
