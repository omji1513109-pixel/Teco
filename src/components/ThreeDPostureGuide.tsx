import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Sparkles, 
  Eye, 
  Compass, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { GameDrill, MovementPhase, JointPoses } from '../data/gameKinematicsData';
import { speakCue, stopSpeaking } from '../utils/audioCoach';

export type PostureDisplayMode = 'student' | 'ideal' | 'morph' | 'ghost';
export type CameraAnglePreset = 'front' | 'side' | 'top' | 'perspective';

interface ThreeDPostureGuideProps {
  drill: GameDrill;
  activePhaseIndex: number;
  onPhaseChange: (newPhaseIndex: number) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const ThreeDPostureGuide: React.FC<ThreeDPostureGuideProps> = ({
  drill,
  activePhaseIndex,
  onPhaseChange,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // States
  const [postureMode, setPostureMode] = useState<PostureDisplayMode>('morph');
  const [isPlayingMotion, setIsPlayingMotion] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.5); // Default slow-mo for athletic study
  const [showKineticVectors, setShowKineticVectors] = useState<boolean>(true);
  const [showGhostOverlay, setShowGhostOverlay] = useState<boolean>(true);
  const [showJointLabels, setShowJointLabels] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<CameraAnglePreset>('perspective');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [scrubPercent, setScrubPercent] = useState<number>(0);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Model parts refs
  const studentModelRef = useRef<any>(null);
  const idealGhostModelRef = useRef<any>(null);
  const comPlumbLineRef = useRef<THREE.Line | null>(null);
  const forceVectorArrowRef = useRef<THREE.ArrowHelper | null>(null);

  // Morph progress (0 = Student, 1 = Ideal)
  const morphProgressRef = useRef<number>(0.5);
  const morphDirectionRef = useRef<number>(1);
  const playbackClockRef = useRef<number>(0);

  const activePhase: MovementPhase = drill.phases[activePhaseIndex] || drill.phases[0];

  // Helper to linear interpolate between two numbers
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // Blend two joint poses
  const blendPoses = (p1: JointPoses, p2: JointPoses, factor: number): JointPoses => ({
    torsoLean: lerp(p1.torsoLean, p2.torsoLean, factor),
    pelvisY: lerp(p1.pelvisY, p2.pelvisY, factor),
    rightArmPitch: lerp(p1.rightArmPitch, p2.rightArmPitch, factor),
    rightArmRoll: lerp(p1.rightArmRoll, p2.rightArmRoll, factor),
    rightElbowBend: lerp(p1.rightElbowBend, p2.rightElbowBend, factor),
    rightWristFlex: lerp(p1.rightWristFlex, p2.rightWristFlex, factor),
    leftArmPitch: lerp(p1.leftArmPitch, p2.leftArmPitch, factor),
    leftArmRoll: lerp(p1.leftArmRoll, p2.leftArmRoll, factor),
    leftElbowBend: lerp(p1.leftElbowBend, p2.leftElbowBend, factor),
    rightHipPitch: lerp(p1.rightHipPitch, p2.rightHipPitch, factor),
    rightKneeBend: lerp(p1.rightKneeBend, p2.rightKneeBend, factor),
    rightKneeValgus: lerp(p1.rightKneeValgus, p2.rightKneeValgus, factor),
    leftHipPitch: lerp(p1.leftHipPitch, p2.leftHipPitch, factor),
    leftKneeBend: lerp(p1.leftKneeBend, p2.leftKneeBend, factor),
    leftKneeValgus: lerp(p1.leftKneeValgus, p2.leftKneeValgus, factor),
  });

  // Build an articulated kinetic mannequin
  const createKineticMannequin = (isGhost = false, baseColor = 0xa3e635, jointColor = 0x22d3ee) => {
    const root = new THREE.Group();

    const limbMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.35,
      metalness: 0.65,
      transparent: isGhost,
      opacity: isGhost ? 0.35 : 0.95,
      wireframe: isGhost,
    });

    const jointMaterial = new THREE.MeshStandardMaterial({
      color: jointColor,
      roughness: 0.2,
      metalness: 0.8,
      emissive: jointColor,
      emissiveIntensity: isGhost ? 0.2 : 0.6,
      transparent: isGhost,
      opacity: isGhost ? 0.4 : 1.0,
    });

    const warningJointMaterial = new THREE.MeshStandardMaterial({
      color: 0xf43f5e, // Red alert for flawed joints
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0xf43f5e,
      emissiveIntensity: 0.85,
    });

    const headMaterial = new THREE.MeshStandardMaterial({
      color: isGhost ? 0x64748b : 0xf8fafc,
      roughness: 0.2,
      metalness: 0.7,
      transparent: isGhost,
      opacity: isGhost ? 0.35 : 0.95,
    });

    // 1. Pelvis / Hips Core
    const pelvis = new THREE.Group();
    const pelvisMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.16, 16), limbMaterial);
    pelvisMesh.rotation.z = Math.PI / 2;
    pelvis.add(pelvisMesh);

    const pelvisCenterSphere = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), jointMaterial);
    pelvis.add(pelvisCenterSphere);

    // 2. Spine & Torso
    const spine = new THREE.Group();
    spine.position.y = 0.08;
    pelvis.add(spine);

    const spineMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.30, 16), limbMaterial);
    spineMesh.position.y = 0.15;
    spine.add(spineMesh);

    // 3. Chest / Thorax / Shoulders
    const chest = new THREE.Group();
    chest.position.y = 0.30;
    spine.add(chest);

    const chestMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.17, 0.24, 16), limbMaterial);
    chestMesh.position.y = 0.12;
    chest.add(chestMesh);

    // 4. Neck & Head
    const neck = new THREE.Group();
    neck.position.y = 0.25;
    chest.add(neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 20), headMaterial);
    head.position.y = 0.16;
    neck.add(head);

    // Head Visor (shows gaze direction)
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.05, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.7 })
    );
    visor.position.set(0, 0.16, 0.10);
    neck.add(visor);

    // 5. Right Arm Hierarchy (Shoulder -> Upper Arm -> Elbow -> Forearm -> Hand)
    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.26, 0.20, 0);
    chest.add(rightShoulder);

    const rightShoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), jointMaterial);
    rightShoulder.add(rightShoulderJoint);

    const rightUpperArm = new THREE.Group();
    rightShoulder.add(rightUpperArm);

    const rightUpperArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.32, 12), limbMaterial);
    rightUpperArmMesh.position.y = -0.16;
    rightUpperArm.add(rightUpperArmMesh);

    const rightElbow = new THREE.Group();
    rightElbow.position.y = -0.32;
    rightUpperArm.add(rightElbow);

    const rightElbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), jointMaterial);
    rightElbow.add(rightElbowJoint);

    const rightForearm = new THREE.Group();
    rightElbow.add(rightForearm);

    const rightForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.30, 12), limbMaterial);
    rightForearmMesh.position.y = -0.15;
    rightForearm.add(rightForearmMesh);

    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), jointMaterial);
    rightHand.position.y = -0.32;
    rightForearm.add(rightHand);

    // 6. Left Arm Hierarchy
    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.26, 0.20, 0);
    chest.add(leftShoulder);

    const leftShoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), jointMaterial);
    leftShoulder.add(leftShoulderJoint);

    const leftUpperArm = new THREE.Group();
    leftShoulder.add(leftUpperArm);

    const leftUpperArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.32, 12), limbMaterial);
    leftUpperArmMesh.position.y = -0.16;
    leftUpperArm.add(leftUpperArmMesh);

    const leftElbow = new THREE.Group();
    leftElbow.position.y = -0.32;
    leftUpperArm.add(leftElbow);

    const leftElbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), jointMaterial);
    leftElbow.add(leftElbowJoint);

    const leftForearm = new THREE.Group();
    leftElbow.add(leftForearm);

    const leftForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.30, 12), limbMaterial);
    leftForearmMesh.position.y = -0.15;
    leftForearm.add(leftForearmMesh);

    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), jointMaterial);
    leftHand.position.y = -0.32;
    leftForearm.add(leftHand);

    // 7. Right Leg Hierarchy (Hip -> Thigh -> Knee -> Shin -> Foot)
    const rightHip = new THREE.Group();
    rightHip.position.set(0.14, -0.05, 0);
    pelvis.add(rightHip);

    const rightHipJoint = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 16), jointMaterial);
    rightHip.add(rightHipJoint);

    const rightThigh = new THREE.Group();
    rightHip.add(rightThigh);

    const rightThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.44, 16), limbMaterial);
    rightThighMesh.position.y = -0.22;
    rightThigh.add(rightThighMesh);

    const rightKnee = new THREE.Group();
    rightKnee.position.y = -0.44;
    rightThigh.add(rightKnee);

    const rightKneeJoint = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), jointMaterial);
    rightKnee.add(rightKneeJoint);

    const rightShin = new THREE.Group();
    rightKnee.add(rightShin);

    const rightShinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.05, 0.42, 16), limbMaterial);
    rightShinMesh.position.y = -0.21;
    rightShin.add(rightShinMesh);

    const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.06, 0.22), jointMaterial);
    rightFoot.position.set(0, -0.44, 0.06);
    rightShin.add(rightFoot);

    // 8. Left Leg Hierarchy
    const leftHip = new THREE.Group();
    leftHip.position.set(-0.14, -0.05, 0);
    pelvis.add(leftHip);

    const leftHipJoint = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 16), jointMaterial);
    leftHip.add(leftHipJoint);

    const leftThigh = new THREE.Group();
    leftHip.add(leftThigh);

    const leftThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.44, 16), limbMaterial);
    leftThighMesh.position.y = -0.22;
    leftThigh.add(leftThighMesh);

    const leftKnee = new THREE.Group();
    leftKnee.position.y = -0.44;
    leftThigh.add(leftKnee);

    const leftKneeJoint = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), jointMaterial);
    leftKnee.add(leftKneeJoint);

    const leftShin = new THREE.Group();
    leftKnee.add(leftShin);

    const leftShinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.05, 0.42, 16), limbMaterial);
    leftShinMesh.position.y = -0.21;
    leftShin.add(leftShinMesh);

    const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.06, 0.22), jointMaterial);
    leftFoot.position.set(0, -0.44, 0.06);
    leftShin.add(leftFoot);

    root.add(pelvis);

    return {
      root,
      pelvis,
      spine,
      chest,
      neck,
      rightShoulder,
      rightUpperArm,
      rightElbow,
      rightElbowJoint,
      rightForearm,
      leftShoulder,
      leftUpperArm,
      leftElbow,
      leftForearm,
      rightHip,
      rightThigh,
      rightKnee,
      rightKneeJoint,
      rightShin,
      leftHip,
      leftThigh,
      leftKnee,
      leftKneeJoint,
      leftShin,
      warningJointMaterial,
      jointMaterial,
    };
  };

  // Apply joint angles to model
  const applyPoseToModel = (model: any, pose: JointPoses, highlightFaults = false) => {
    if (!model) return;

    // Pelvis position & spine lean
    model.pelvis.position.y = pose.pelvisY;
    model.spine.rotation.x = pose.torsoLean;

    // Right arm
    model.rightShoulder.rotation.x = pose.rightArmPitch;
    model.rightShoulder.rotation.z = -pose.rightArmRoll;
    model.rightElbow.rotation.x = -pose.rightElbowBend;
    model.rightForearm.rotation.x = pose.rightWristFlex;

    // Left arm
    model.leftShoulder.rotation.x = pose.leftArmPitch;
    model.leftShoulder.rotation.z = -pose.leftArmRoll;
    model.leftElbow.rotation.x = -pose.leftElbowBend;

    // Right leg
    model.rightHip.rotation.x = -pose.rightHipPitch;
    model.rightHip.rotation.z = pose.rightKneeValgus;
    model.rightKnee.rotation.x = pose.rightKneeBend;

    // Left leg
    model.leftHip.rotation.x = -pose.leftHipPitch;
    model.leftHip.rotation.z = -pose.leftKneeValgus;
    model.leftKnee.rotation.x = pose.leftKneeBend;

    // Highlight faulty joints in Red if student model and highlightFaults is true
    if (highlightFaults) {
      const hasElbowFault = Math.abs(pose.rightArmRoll) > 0.45;
      const hasKneeValgusFault = Math.abs(pose.rightKneeValgus) > 0.06;

      if (model.rightElbowJoint) {
        model.rightElbowJoint.material = hasElbowFault ? model.warningJointMaterial : model.jointMaterial;
      }
      if (model.rightKneeJoint) {
        model.rightKneeJoint.material = hasKneeValgusFault ? model.warningJointMaterial : model.jointMaterial;
      }
    }
  };

  // Initialize Three.js Scene, Camera, Controls, Lights, Grid
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 640;
    const height = mountRef.current.clientHeight || 480;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111319);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2.4, 1.8, 3.2);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mountRef.current.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Do not go underground
    controls.minDistance = 1.2;
    controls.maxDistance = 6.5;
    controls.target.set(0, 0.9, 0);
    controlsRef.current = controls;

    // 5. High-Tech Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(4, 6, 4);
    scene.add(mainLight);

    // Neon Rim Lights (Lime energy & cyan contour)
    const limeRimLight = new THREE.DirectionalLight(0xa3e635, 1.6);
    limeRimLight.position.set(-4, 3, -3);
    scene.add(limeRimLight);

    const cyanRimLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    cyanRimLight.position.set(3, -2, -3);
    scene.add(cyanRimLight);

    // 6. Ground Studio Grid & Target Bullseye
    const gridHelper = new THREE.GridHelper(6, 24, 0x22d3ee, 0x1f2937);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Athletic base ring
    const ringGeo = new THREE.RingGeometry(0.3, 0.65, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xa3e635, side: THREE.DoubleSide, transparent: true, opacity: 0.25 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.005;
    scene.add(ringMesh);

    // 7. Create 3D Mannequins
    // Main Student / Morph Model
    const studentModel = createKineticMannequin(false, 0x94a3b8, 0x38bdf8);
    scene.add(studentModel.root);
    studentModelRef.current = studentModel;

    // Ideal Ghost Model (semi-transparent green wireframe)
    const ghostModel = createKineticMannequin(true, 0xa3e635, 0xa3e635);
    scene.add(ghostModel.root);
    idealGhostModelRef.current = ghostModel;

    // 8. Kinetic Overlays: Center of Mass Plumb Line
    const plumbLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 1.8, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const plumbLineMat = new THREE.LineDashedMaterial({
      color: 0xef4444,
      dashSize: 0.08,
      gapSize: 0.04,
      linewidth: 2,
    });
    const plumbLine = new THREE.Line(plumbLineGeo, plumbLineMat);
    plumbLine.computeLineDistances();
    scene.add(plumbLine);
    comPlumbLineRef.current = plumbLine;

    // Force Projection Arrow
    const forceArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0.5).normalize(),
      new THREE.Vector3(0, 0.9, 0),
      0.8,
      0xa3e635,
      0.15,
      0.08
    );
    scene.add(forceArrow);
    forceVectorArrowRef.current = forceArrow;

    // 9. Resize Observer
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 10. Main Animation Loop
    let lastTime = performance.now();

    const animate = (time: number) => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const delta = (time - lastTime) / 1000;
      lastTime = time;

      controls.update();

      // Dynamic motion loop or morphing
      if (isPlayingMotion) {
        playbackClockRef.current += delta * playbackSpeed;
        
        // Loop through the 4 phases smoothly across a 4-second cycle
        const totalDuration = 4.0;
        const normalizedTime = (playbackClockRef.current % totalDuration) / totalDuration;
        setScrubPercent(Math.round(normalizedTime * 100));

        // Determine current phase from normalized continuous time
        const phaseFloat = normalizedTime * (drill.phases.length);
        const currentPIdx = Math.floor(phaseFloat) % drill.phases.length;
        const nextPIdx = (currentPIdx + 1) % drill.phases.length;
        const phaseInterp = phaseFloat - Math.floor(phaseFloat);

        const currentPhaseObj = drill.phases[currentPIdx];
        const nextPhaseObj = drill.phases[nextPIdx];

        if (currentPhaseObj && nextPhaseObj) {
          // Continuous smooth animated trajectory
          const currentStudentPose = blendPoses(
            currentPhaseObj.threeDJoints.student,
            nextPhaseObj.threeDJoints.student,
            phaseInterp
          );

          const currentIdealPose = blendPoses(
            currentPhaseObj.threeDJoints.ideal,
            nextPhaseObj.threeDJoints.ideal,
            phaseInterp
          );

          // Apply according to selected display mode
          if (postureMode === 'student') {
            applyPoseToModel(studentModelRef.current, currentStudentPose, true);
            if (idealGhostModelRef.current) idealGhostModelRef.current.root.visible = false;
          } else if (postureMode === 'ideal') {
            applyPoseToModel(studentModelRef.current, currentIdealPose, false);
            if (idealGhostModelRef.current) idealGhostModelRef.current.root.visible = false;
          } else if (postureMode === 'ghost') {
            applyPoseToModel(studentModelRef.current, currentStudentPose, true);
            if (idealGhostModelRef.current) {
              idealGhostModelRef.current.root.visible = true;
              applyPoseToModel(idealGhostModelRef.current, currentIdealPose, false);
            }
          } else {
            // Morph Mode: Oscillate between Student and Ideal to guide correction
            morphProgressRef.current += delta * 1.2 * morphDirectionRef.current;
            if (morphProgressRef.current > 1) {
              morphProgressRef.current = 1;
              morphDirectionRef.current = -1;
            } else if (morphProgressRef.current < 0) {
              morphProgressRef.current = 0;
              morphDirectionRef.current = 1;
            }

            const morphedPose = blendPoses(currentStudentPose, currentIdealPose, morphProgressRef.current);
            applyPoseToModel(studentModelRef.current, morphedPose, morphProgressRef.current < 0.4);

            if (idealGhostModelRef.current) {
              idealGhostModelRef.current.root.visible = showGhostOverlay;
              applyPoseToModel(idealGhostModelRef.current, currentIdealPose, false);
            }
          }
        }
      } else {
        // Paused on specific static phase
        const currentPhaseObj = drill.phases[activePhaseIndex] || drill.phases[0];
        if (currentPhaseObj) {
          const studentPose = currentPhaseObj.threeDJoints.student;
          const idealPose = currentPhaseObj.threeDJoints.ideal;

          if (postureMode === 'student') {
            applyPoseToModel(studentModelRef.current, studentPose, true);
            if (idealGhostModelRef.current) idealGhostModelRef.current.root.visible = false;
          } else if (postureMode === 'ideal') {
            applyPoseToModel(studentModelRef.current, idealPose, false);
            if (idealGhostModelRef.current) idealGhostModelRef.current.root.visible = false;
          } else if (postureMode === 'ghost') {
            applyPoseToModel(studentModelRef.current, studentPose, true);
            if (idealGhostModelRef.current) {
              idealGhostModelRef.current.root.visible = true;
              applyPoseToModel(idealGhostModelRef.current, idealPose, false);
            }
          } else {
            // Morph between the two
            morphProgressRef.current += delta * 1.4 * morphDirectionRef.current;
            if (morphProgressRef.current > 1) {
              morphProgressRef.current = 1;
              morphDirectionRef.current = -1;
            } else if (morphProgressRef.current < 0) {
              morphProgressRef.current = 0;
              morphDirectionRef.current = 1;
            }
            const morphedPose = blendPoses(studentPose, idealPose, morphProgressRef.current);
            applyPoseToModel(studentModelRef.current, morphedPose, morphProgressRef.current < 0.35);

            if (idealGhostModelRef.current) {
              idealGhostModelRef.current.root.visible = showGhostOverlay;
              applyPoseToModel(idealGhostModelRef.current, idealPose, false);
            }
          }
        }
      }

      // Update Center of Mass Plumb line position
      if (comPlumbLineRef.current && studentModelRef.current) {
        comPlumbLineRef.current.visible = showKineticVectors;
        const pelvisY = studentModelRef.current.pelvis.position.y || 0.9;
        comPlumbLineRef.current.position.set(0, 0, 0);
      }

      // Update Force Vector Arrow
      if (forceVectorArrowRef.current) {
        forceVectorArrowRef.current.visible = showKineticVectors;
      }

      renderer.render(scene, camera);
    };

    animate(performance.now());

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [drill, postureMode, isPlayingMotion, playbackSpeed, showKineticVectors, showGhostOverlay, activePhaseIndex]);

  // Set camera angle preset
  const handleSetCameraPreset = (preset: CameraAnglePreset) => {
    setCameraPreset(preset);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (preset === 'front') {
      camera.position.set(0, 1.1, 3.4);
      controls.target.set(0, 0.9, 0);
    } else if (preset === 'side') {
      camera.position.set(3.4, 1.1, 0);
      controls.target.set(0, 0.9, 0);
    } else if (preset === 'top') {
      camera.position.set(0, 3.6, 0.05);
      controls.target.set(0, 0, 0);
    } else {
      camera.position.set(2.4, 1.8, 3.2);
      controls.target.set(0, 0.9, 0);
    }
    controls.update();
  };

  // Play audio coaching cue
  const handleSpeakCoachCue = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakCue(activePhase.voiceCue, () => setIsSpeaking(false));
    }
  };

  return (
    <div className={`neu-card rounded-3xl overflow-hidden flex flex-col transition-all ${isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : 'relative w-full'}`}>
      
      {/* 3D Header Toolbar */}
      <div className="px-5 py-4 border-b border-black/40 flex flex-wrap items-center justify-between gap-3 bg-[#161a22]/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-lime-500/10 text-lime-400 border border-lime-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm sm:text-base tracking-tight">
                3D Kinetic Mannequin & Posture Guide
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-lime-400/10 text-lime-400 border border-lime-400/20">
                GPU THREE.JS
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Click & drag to rotate 360° · Scroll to zoom · Compare detected faults against ideal gold-standard
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSpeakCoachCue}
            className={`neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isSpeaking ? 'text-lime-400 border-lime-400/40 animate-pulse' : 'text-neutral-300 hover:text-white'
            }`}
            title="Listen to 3D Audio Coach instruction for this phase"
          >
            <Volume2 className="h-3.5 w-3.5 text-lime-400" />
            <span>{isSpeaking ? 'Speaking...' : 'Audio Cue'}</span>
          </button>

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="neu-btn p-2 rounded-xl text-neutral-400 hover:text-white transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand 3D Canvas'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Main 3D Canvas Viewport */}
      <div className="relative flex-1 min-h-[360px] sm:min-h-[440px] bg-[#111319] overflow-hidden">
        
        {/* Three.js DOM Container */}
        <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Top-Left Floating Posture Mode Selector */}
        <div className="absolute top-4 left-4 z-10 neu-inset-subtle p-1 rounded-2xl flex flex-wrap gap-1 shadow-lg backdrop-blur-md">
          <button
            onClick={() => setPostureMode('morph')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              postureMode === 'morph'
                ? 'neu-btn text-lime-400 shadow-sm border border-lime-400/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Guided Morph
          </button>

          <button
            onClick={() => setPostureMode('student')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              postureMode === 'student'
                ? 'neu-btn text-rose-400 shadow-sm border border-rose-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Student Flaws
          </button>

          <button
            onClick={() => setPostureMode('ideal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              postureMode === 'ideal'
                ? 'neu-btn text-emerald-400 shadow-sm border border-emerald-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Right Method (Ideal)
          </button>

          <button
            onClick={() => setPostureMode('ghost')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              postureMode === 'ghost'
                ? 'neu-btn text-cyan-400 shadow-sm border border-cyan-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Ghost Overlay
          </button>
        </div>

        {/* Top-Right Camera Angle Quick Presets */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
          <div className="neu-inset-subtle p-1 rounded-xl flex items-center gap-1 shadow-lg backdrop-blur-md text-[11px] font-mono">
            <button
              onClick={() => handleSetCameraPreset('front')}
              className={`px-2 py-1 rounded-lg transition-all ${cameraPreset === 'front' ? 'neu-btn text-lime-400 font-bold' : 'text-neutral-400 hover:text-white'}`}
            >
              Front
            </button>
            <button
              onClick={() => handleSetCameraPreset('side')}
              className={`px-2 py-1 rounded-lg transition-all ${cameraPreset === 'side' ? 'neu-btn text-lime-400 font-bold' : 'text-neutral-400 hover:text-white'}`}
            >
              Side
            </button>
            <button
              onClick={() => handleSetCameraPreset('top')}
              className={`px-2 py-1 rounded-lg transition-all ${cameraPreset === 'top' ? 'neu-btn text-lime-400 font-bold' : 'text-neutral-400 hover:text-white'}`}
            >
              Top
            </button>
            <button
              onClick={() => handleSetCameraPreset('perspective')}
              className={`px-2 py-1 rounded-lg transition-all ${cameraPreset === 'perspective' ? 'neu-btn text-lime-400 font-bold' : 'text-neutral-400 hover:text-white'}`}
            >
              3/4
            </button>
          </div>

          {/* Overlay Toggles */}
          <div className="neu-inset-subtle p-1 rounded-xl flex items-center justify-between gap-2 text-[10px] font-mono text-neutral-300">
            <button
              onClick={() => setShowKineticVectors(!showKineticVectors)}
              className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all ${showKineticVectors ? 'text-lime-400 font-bold' : 'text-neutral-500'}`}
            >
              <Compass className="h-3 w-3" />
              <span>COM Plumb</span>
            </button>
            <button
              onClick={() => setShowGhostOverlay(!showGhostOverlay)}
              className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all ${showGhostOverlay ? 'text-cyan-400 font-bold' : 'text-neutral-500'}`}
            >
              <Layers className="h-3 w-3" />
              <span>Ghost</span>
            </button>
          </div>
        </div>

        {/* Bottom Floating Status Banner */}
        <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-none">
          {/* Active Phase Pill */}
          <div className="pointer-events-auto neu-inset-subtle px-4 py-2 rounded-2xl flex items-center gap-2.5 shadow-xl backdrop-blur-md border border-white/5">
            <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-pulse shadow-[0_0_8px_rgba(163,230,53,0.8)]" />
            <div>
              <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                Current Kinematic Phase
              </div>
              <div className="text-xs font-bold text-white">
                {activePhase.name}
              </div>
            </div>
          </div>

          {/* Morph Indicator status badge */}
          {postureMode === 'morph' && (
            <div className="pointer-events-auto neu-inset-subtle px-3.5 py-1.5 rounded-xl text-[11px] font-mono text-neutral-300 flex items-center gap-2 backdrop-blur-md">
              <span className="text-rose-400 font-semibold">Student Flaw</span>
              <ArrowRight className="h-3 w-3 text-lime-400 animate-pulse" />
              <span className="text-lime-400 font-bold">Right Method</span>
            </div>
          )}
        </div>

      </div>

      {/* Interactive 3D Playback & Phase Stepper Strip */}
      <div className="p-4 sm:p-5 border-t border-black/40 bg-[#14171d] space-y-4">
        
        {/* Phase Stepper Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {drill.phases.map((phase, idx) => (
            <button
              key={idx}
              onClick={() => {
                onPhaseChange(idx);
                setIsPlayingMotion(false);
              }}
              className={`p-2.5 rounded-xl text-left transition-all text-xs ${
                activePhaseIndex === idx
                  ? 'neu-btn-active text-lime-400 border border-lime-400/30'
                  : 'neu-btn text-neutral-400 hover:text-white'
              }`}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-0.5">
                Phase 0{idx + 1}
              </div>
              <div className="font-semibold truncate">
                {phase.name.split(':')[1]?.trim() || phase.name}
              </div>
            </button>
          ))}
        </div>

        {/* Playback Controls & Speed Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlayingMotion(!isPlayingMotion)}
              className="neu-btn-primary p-2.5 rounded-xl font-bold flex items-center gap-1.5 text-xs shadow-md"
            >
              {isPlayingMotion ? (
                <>
                  <Pause className="h-3.5 w-3.5 fill-current" />
                  <span>Pause 3D Loop</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Play Motion Cycle</span>
                </>
              )}
            </button>

            {/* Speed Selector */}
            <div className="neu-inset-subtle p-1 rounded-xl flex items-center gap-1 text-[11px] font-mono">
              {[0.25, 0.5, 1.0].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    playbackSpeed === speed
                      ? 'neu-btn text-lime-400 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Quick coaching summary */}
          <div className="text-xs text-neutral-300 max-w-md line-clamp-1 italic">
            "{activePhase.coachingCue}"
          </div>
        </div>

      </div>

    </div>
  );
};
