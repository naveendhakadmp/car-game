import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Naveen Driving Car - simple game code
const byId = id => document.getElementById(id);
const cars = [
  {id:'alto',name:'Alto',price:0,level:1,color:0xd9d9d9,type:1},
  {id:'baleno',name:'Baleno',price:100,level:2,color:0x245b9e,type:2},
  {id:'fortuner',name:'Fortuner',price:250,level:3,color:0x22262b,type:3},
  {id:'thar',name:'Thar',price:400,level:4,color:0x6a7168,type:4},
  {id:'scorpio',name:'Scorpio',price:600,level:5,color:0x202428,type:5},
  {id:'bmw',name:'BMW',price:900,level:6,color:0x1c4c85,type:6},
  {id:'mercedes',name:'Mercedes',price:1300,level:7,color:0x30343a,type:7},
  {id:'rolls',name:'Rolls-Royce',price:2000,level:8,color:0x242424,type:8}
];
let save = JSON.parse(localStorage.getItem('naveenDriveSave') || 'null') || {coins:0,level:1,xp:0,car:'alto',owned:['alto']};
let engineOn=false, gear='D', speed=0, steer=0, gas=false, brake=false, gasTouch=false, brakeTouch=false, steerTouch=0, cameraMode=0, paused=false, crashPoint=null, crashCooldown=0, gameStarted=false;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x91cff7); scene.fog = new THREE.Fog(0x91cff7,100,360);
const camera = new THREE.PerspectiveCamera(68,innerWidth/innerHeight,.1,600);
const renderer = new THREE.WebGLRenderer({antialias:true}); renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.12; renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; byId('game').appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xe0f4ff,0x53634a,1.8)); const sun=new THREE.DirectionalLight(0xffffff,2.4); sun.position.set(-30,60,25); sun.castShadow=true; scene.add(sun);
const mat=(color,roughness=.7,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
function cube(w,h,d,color,x,y,z,material=null){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material||mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m;}
const ground=new THREE.Mesh(new THREE.PlaneGeometry(280,1800),mat(0x639b50));ground.rotation.x=-Math.PI/2;ground.position.y=-.08;scene.add(ground);
// The road and its markings follow the player, so the road never runs out.
const road=cube(18,.12,1800,0x30363b,0,-.01,-400);scene.add(road);
const roadMarks=[];
for(let z=-1280;z<500;z+=12){roadMarks.push(cube(.15,.02,5,0xffffff,0,.06,z));roadMarks.push(cube(.11,.02,4.5,0xe8e8e8,-3,.061,z));roadMarks.push(cube(.11,.02,4.5,0xe8e8e8,3,.061,z));}
roadMarks.push(cube(.18,.025,1800,0xf4f0d8,-8.55,.065,-400),cube(.18,.025,1800,0xf4f0d8,8.55,.065,-400));roadMarks.forEach(m=>scene.add(m));
let levelDistance=0; const LEVEL_DISTANCE=1200; let distanceTravelled=0;
// Traffic signals near a few intersections
for(let z of [-120,-360,-600,-840]){
  for(let side of [-1,1]){
    scene.add(cube(.18,4,.18,0x33383c,side*9,2,z));
    scene.add(cube(1.15,.55,.45,0x202428,side*9,4,z));
    for(let j=0;j<3;j++){let lamp=new THREE.Mesh(new THREE.SphereGeometry(.13,12,10),mat([0xe52c2c,0xe5b72c,0x28c65a][j],.3));lamp.position.set(side*9,4.15-j*.17,z-.24);scene.add(lamp)}
  }
}
// road-side homes and trees
for(let i=0;i<70;i++){let z=-i*22;for(const side of [-1,1]){let x=side*(14+Math.random()*12);let h=3+Math.random()*7;scene.add(cube(4+Math.random()*4,h,5+Math.random()*4,[0xd2c2a5,0xc5d0d3,0xd5d8cb,0xb4bfc3][i%4],x,h/2,z));scene.add(cube(4.8,h*.12,5.5,0x8d5f40,x,h*.72,z));if(i%3===0){let trunk=cube(.4,2,.4,0x6b4b31,x+4,1,z-4);scene.add(trunk);let crown=new THREE.Mesh(new THREE.SphereGeometry(1.8,10,8),mat(0x3d7a3c));crown.position.set(x+4,3,z-4);scene.add(crown);}}}
function wheelMesh(x,y,z,r=.48){let w=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.26,20),mat(0x111315,.9));w.rotation.z=Math.PI/2;w.position.set(x,y,z);return w;}
function makeCarBody(car){let g=new THREE.Group(),t=car.type,w=t>=3?2.2:1.9,h=t===4?1.45:t>=3?1.15:.9,l=t===8?5.2:t>=6?4.8:t>=3?4.5:3.7;g.add(cube(w,h,l*.75,car.color,0,.7,0));g.add(cube(w*.82,.65,l*.42,car.color,0,1.35,-.05));let glass=mat(0x172b3b,.2,.15);g.add(cube(w*.72,.42,.05,0,0,1.43,-.78,glass));g.add(cube(w*.72,.42,.05,0,0,1.43,.75,glass));for(let x of [-w/2-.05,w/2+.05])for(let z of [-l*.28,l*.28])g.add(wheelMesh(x,.43,z,.52));g.add(cube(.42,.16,.08,0xfff0bf,-.55,1,-l*.39));g.add(cube(.42,.16,.08,0xfff0bf,.55,1,-l*.39));g.add(cube(.36,.16,.08,0xc51f24,-.55,1,l*.39));g.add(cube(.36,.16,.08,0xc51f24,.55,1,l*.39));if(t===4)g.add(wheelMesh(0,1.05,l*.46,.42));if(t>=6){g.add(cube(w*.7,.15,.12,0x111111,0,.95,-l*.4));g.add(cube(w*.45,.12,.08,0xd4d8dc,0,1.02,-l*.43));}return g;}
function makeCockpit(car){let g=new THREE.Group(),premium=car.type>=6,suv=car.type>=3&&car.type<=5,dw=premium?3.9:suv?3.65:3.35;
// dash shell, two analog dials, steering wheel and center display
g.add(cube(dw,.36,.95,0x171b20,0,1.38,-.55));g.add(cube(dw,.07,1,0x30363d,0,1.59,-.55));
for(let x of [-.95,-.3]){let dial=new THREE.Mesh(new THREE.CylinderGeometry(.31,.31,.07,32),mat(0x050709));dial.rotation.x=Math.PI/2;dial.position.set(x,1.72,-.98);g.add(dial);let rim=new THREE.Mesh(new THREE.TorusGeometry(.29,.035,8,28),mat(0xc3cbd1,.3,.6));rim.position.set(x,1.72,-1.025);g.add(rim);let needle=cube(.025,.02,.22,0xff4b44,x,1.72,-1.04);needle.name=x<0?'speedNeedle':'rpmNeedle';needle.rotation.z=.4;g.add(needle);}
let steering=new THREE.Group();steering.name='steeringWheel';let rim=new THREE.Mesh(new THREE.TorusGeometry(.46,.075,12,32),mat(0x080a0c));rim.position.set(-1.03,1.32,-1.02);rim.rotation.x=Math.PI/2;steering.add(rim);steering.add(cube(.12,.08,.58,0x151a1f,-1.03,1.32,-1.02));steering.add(cube(.5,.07,.09,0x151a1f,-1.03,1.32,-1.02));g.add(steering);
g.add(cube(premium?1.5:1.28,.48,.08,0x070a0d,.55,1.62,-1.03));g.add(cube(premium?1.28:1.08,.25,.015,0x16405d,.55,1.63,-1.08));for(let x of [.05,.95])g.add(cube(.5,.09,.07,0x66717a,x,1.18,-1.02));
// middle console: gear lever visibly changes when gear is selected
g.add(cube(premium?1.15:.92,.22,1.8,0x11161a,.48,.63,.08));let shifter=cube(.18,.43,.22,0x9ba5ad,.48,.92,-.28);shifter.name='gearLever';g.add(shifter);g.add(cube(.38,.06,.3,0x222a31,.48,.72,-.28));for(let z of [.45,.8]){let cup=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.04,20),mat(0x050607));cup.position.set(.48,.77,z);g.add(cup)}
// seats and door panels
g.add(cube(.85,1.1,.8,premium?0x292a2b:0x20252a,-1.12,.72,.78));g.add(cube(.85,1.1,.8,premium?0x292a2b:0x20252a,1.15,.72,.78));g.add(cube(.05,.04,3.1,0x287fff,-1.75,1,.15));g.add(cube(.05,.04,3.1,0xb22aff,1.75,1,.15));
// driver head, body, arms
g.add(new THREE.Mesh(new THREE.SphereGeometry(.24,16,16),mat(0x986a4f)));g.children[g.children.length-1].position.set(-1.05,1.72,.52);g.add(cube(.5,.85,.32,0x27394a,-1.05,1.2,.62));let arm1=cube(.11,.48,.11,0x986a4f,-.73,1.27,.15),arm2=cube(.11,.48,.11,0x986a4f,-1.34,1.27,.15);arm1.name='driverArm1';arm2.name='driverArm2';g.add(arm1,arm2);return g;}
let player=new THREE.Group();scene.add(player);let playerPos=new THREE.Vector3(0,0,10);function rebuildCar(){scene.remove(player);player=new THREE.Group();let car=cars.find(c=>c.id===save.car)||cars[0];let body=makeCarBody(car);body.name='body';let cockpit=makeCockpit(car);cockpit.name='cockpit';player.add(body,cockpit);body.visible=cameraMode!==0;cockpit.visible=cameraMode===0;player.position.copy(playerPos);scene.add(player);}rebuildCar();
const traffic=[];for(let i=0;i<3;i++){let car=makeCarBody(cars[(i%5)+1]);car.scale.set(.72,.72,.72);car.position.set([-4.2,0,4.2][i],0,-95-i*145);scene.add(car);traffic.push(car)}
const coinMeshes=[];for(let i=0;i<28;i++){let c=new THREE.Mesh(new THREE.TorusGeometry(.32,.08,10,22),mat(0xffc72c,.25,.5));c.position.set([-4,0,4][i%3],.8,-22-i*42);scene.add(c);coinMeshes.push(c)}
function persist(){localStorage.setItem('naveenDriveSave',JSON.stringify(save));byId('coins').textContent=save.coins;byId('level').textContent='LEVEL '+save.level;byId('xp').textContent=`${save.xp} / ${save.level*1000} XP`;byId('bar').style.width=Math.min(100,save.xp/(save.level*1000)*100)+'%'}function message(t){byId('msg').textContent=t;byId('msg').style.opacity=1;clearTimeout(message.timer);message.timer=setTimeout(()=>byId('msg').style.opacity=0,1500)}
function gainXP(n){save.xp+=n;while(save.xp>=save.level*1000&&save.level<8){save.xp-=save.level*1000;save.level++;message('LEVEL UP!')}persist()}
function openGarage(){byId('garage').classList.add('show');renderGarage()}function renderGarage(){let grid=byId('carGrid');grid.innerHTML='';cars.forEach(car=>{let owned=save.owned.includes(car.id),can=save.level>=car.level&&save.coins>=car.price;let el=document.createElement('div');el.className='carTile';el.innerHTML=`<div class="carIcon">🚘</div><h3>${car.name}</h3><p>Level ${car.level} · ${car.price} coins</p><button>${owned?(save.car===car.id?'SELECTED':'SELECT'):can?'BUY':'LOCKED'}</button>`;let b=el.querySelector('button');b.disabled=!owned&&!can;if(owned)b.onclick=()=>{save.car=car.id;persist();rebuildCar();byId('garage').classList.remove('show');message(car.name+' selected')};else if(can)b.onclick=()=>{save.coins-=car.price;save.owned.push(car.id);save.car=car.id;persist();rebuildCar();renderGarage();message(car.name+' bought!')};grid.appendChild(el)})}
byId('garageBtn').onclick=openGarage;byId('closeGarage').onclick=()=>byId('garage').classList.remove('show');
byId('gears').querySelectorAll('button').forEach(b=>b.onclick=()=>{gear=b.textContent;byId('gears').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));let lever=player.getObjectByName('gearLever');if(lever){lever.position.x=gear==='P'?.25:gear==='R'?.36:gear==='N'?.45:gear==='D'?.54:.64;lever.rotation.x=gear==='R'?.25:gear==='D'?.1:0;}message('Gear: '+gear)});
byId('engine').onclick=()=>{engineOn=!engineOn;byId('engine').textContent=engineOn?'ENGINE ON':'ENGINE OFF';if(!engineOn){speed=0;gas=false;gasTouch=false}};
// Touch steering wheel: drag around wheel to turn. Keyboard also works.
let wheelDrag=false,lastX=0;const wheel=byId('wheel');wheel.addEventListener('pointerdown',e=>{wheelDrag=true;lastX=e.clientX;wheel.setPointerCapture(e.pointerId);e.preventDefault()});wheel.addEventListener('pointermove',e=>{if(!wheelDrag)return;let dx=e.clientX-lastX;steerTouch=THREE.MathUtils.clamp(steerTouch+dx*.055,-1,1);lastX=e.clientX});function stopWheel(){wheelDrag=false;steerTouch=0}wheel.addEventListener('pointerup',stopWheel);wheel.addEventListener('pointercancel',stopWheel);wheel.addEventListener('lostpointercapture',stopWheel);
function holdButton(id,which){const el=byId(id);const down=e=>{e.preventDefault();if(which==='gas')gasTouch=true;else if(which==='brake')brakeTouch=true;else steerTouch=which;try{el.setPointerCapture(e.pointerId)}catch(_){}};const up=()=>{if(which==='gas')gasTouch=false;else if(which==='brake')brakeTouch=false;else if(!wheelDrag)steerTouch=0};el.addEventListener('pointerdown',down);['pointerup','pointercancel','lostpointercapture'].forEach(ev=>el.addEventListener(ev,up));}
holdButton('gas','gas');holdButton('brake','brake');
const keys={};addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys[k]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(k==='e'&&!e.repeat)byId('engine').click();if(k==='1')setCamera(0);if(k==='2')setCamera(1);if(k==='3')setCamera(2)});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);gasTouch=false;brakeTouch=false;steerTouch=0});
let audio=new Audio('assets/Main_Nikla_Gaddi_Leke.mp3');audio.loop=true;audio.volume=.7;let musicOn=false;byId('song').textContent='Main Nikla Gaddi Leke';function updateMusicButtons(){const label=musicOn?'♫ MUSIC ON':'♫ MUSIC OFF';byId('cockpitMusic').textContent=label;byId('musicOn').textContent=musicOn?'MUSIC ON':'MUSIC OFF'}function toggleMusic(){musicOn=!musicOn;updateMusicButtons();if(musicOn){audio.play().catch(()=>message('Music ke liye MUSIC ON dobara dabao'))}else audio.pause()}updateMusicButtons();byId('musicPanelBtn').onclick=()=>byId('musicPanel').classList.toggle('show');byId('cockpitMusic').onclick=()=>{toggleMusic();byId('musicPanel').classList.add('show')};byId('audioFile').onchange=e=>{let f=e.target.files[0];if(!f)return;audio.src=URL.createObjectURL(f);byId('song').textContent=f.name;if(musicOn)audio.play().catch(()=>{})};byId('play').onclick=()=>{if(audio.paused){musicOn=true;updateMusicButtons();audio.play().catch(()=>message('Music play nahi ho paya'))}else{audio.pause();musicOn=false;updateMusicButtons()}};byId('musicOn').onclick=toggleMusic;byId('vol').oninput=e=>audio.volume=+e.target.value;byId('sound').onclick=()=>{audio.muted=!audio.muted;byId('sound').textContent=audio.muted?'🔇':'🔊'};byId('light').onclick=()=>{const c=player.getObjectByName('cockpit');if(c){const strips=c.children.filter(o=>o.isMesh&&o.material&&o.material.color&&(o.material.color.getHex()===0x287fff||o.material.color.getHex()===0xb22aff));strips.forEach(o=>o.visible=!o.visible);message(strips.some(o=>o.visible)?'Ambient lights ON':'Ambient lights OFF')}};byId('cam').onclick=()=>setCamera((cameraMode+1)%3);byId('interior').onclick=()=>setCamera(0);byId('enterDrive').onclick=()=>{gameStarted=true;cameraMode=0;engineOn=true;byId('engine').textContent='ENGINE ON';byId('startScreen').style.display='none';byId('cockpitMusic').classList.add('ready');document.body.classList.remove('notStarted');setCamera(0);message('Drive started! W/↑ accelerate · A/D or ←/→ steer')};document.body.classList.add('notStarted');
function setCamera(mode){cameraMode=mode;const body=player.getObjectByName('body'),cockpit=player.getObjectByName('cockpit');if(body)body.visible=mode!==0;if(cockpit)cockpit.visible=mode===0;message(['Interior dashboard','Hood view','Outside view'][mode]||'Camera')};
function crash(){if(!gameStarted||crashCooldown>0||byId('crash').classList.contains('show'))return;crashPoint={position:player.position.clone(),rotation:player.rotation.y,musicTime:audio.currentTime||0};audio.pause();speed=0;gas=false;brake=false;byId('crash').classList.add('show')};byId('restart').onclick=()=>{
  // Restart immediately: clear the crash overlay and move nearby traffic away first.
  if(crashPoint){player.position.copy(crashPoint.position);player.position.z+=10;player.rotation.y=0;player.position.x=THREE.MathUtils.clamp(player.position.x,-2.5,2.5);playerPos.copy(player.position);
    traffic.forEach((t,i)=>{if(t.position.distanceTo(player.position)<65){t.position.z=player.position.z-90-i*32-Math.random()*35;t.position.x=[-6,-2,2,6][i%4];}});
    try{audio.currentTime=crashPoint.musicTime}catch(e){}
  }
  speed=0;steer=0;steerTouch=0;gas=false;brake=false;gasTouch=false;brakeTouch=false;engineOn=true;byId('engine').textContent='ENGINE ON';gear='D';byId('gears').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x.textContent==='D'));
  crashCooldown=12;byId('crash').classList.remove('show');if(musicOn)audio.play().catch(()=>{});
};
function update(){if(crashCooldown>0)crashCooldown--;if(!byId('crash').classList.contains('show')){const left=keys.a||keys.arrowleft,right=keys.d||keys.arrowright;gas=!!(gasTouch||keys.w||keys.arrowup);brake=!!(brakeTouch||keys.s||keys.arrowdown);if(left&&!right)steer=-1;else if(right&&!left)steer=1;else if(wheelDrag||steerTouch!==0)steer=steerTouch;else steer*=.82;
if(engineOn&&gear==='D'){if(gas)speed=Math.min(speed+.055,1.8);else speed=Math.max(0,speed-.002)}else if(engineOn&&gear==='S'){if(gas)speed=Math.min(speed+.075,2.15);else speed=Math.max(0,speed-.002)}else if(engineOn&&gear==='R'){if(gas)speed=Math.max(speed-.012,-.35)}else speed*=.94;if(brake)speed*=.86;
player.rotation.y=THREE.MathUtils.lerp(player.rotation.y,-steer*.42,.3);player.position.x=THREE.MathUtils.clamp(player.position.x+steer*.18*(Math.abs(speed)+.35),-7,7);player.position.z-=speed;
if(speed>0){levelDistance+=speed;distanceTravelled+=speed;if(levelDistance>=LEVEL_DISTANCE){levelDistance-=LEVEL_DISTANCE;if(save.level<8){save.level++;save.xp=0;persist();message('LEVEL COMPLETE! Level '+save.level+' unlocked');}else message('LEVEL COMPLETE! Keep driving!');}}
// Keep the scenery centered on the car and recycle road paint ahead.
road.position.z=player.position.z-400;ground.position.z=player.position.z-400;
roadMarks.forEach(m=>{if(m.position.z>player.position.z+25)m.position.z-=1800;});
traffic.forEach((t,i)=>{
  // All traffic travels in the same direction as the player (towards -Z).
  t.position.z-=.22+Math.max(0,speed)*.34;
  if(t.position.z>player.position.z+24 || t.position.z<player.position.z-1500){t.position.z=player.position.z-230-Math.random()*280;t.position.x=[-4.2,0,4.2][i]}
  // Keep a little more clearance so traffic does not cause constant crashes.
  if(crashCooldown<=0&&Math.abs(t.position.z-player.position.z)<2.2&&Math.abs(t.position.x-player.position.x)<1.55)crash();
});coinMeshes.forEach(c=>{c.rotation.y+=.07;if(c.position.z>player.position.z+20)c.position.z-=1200;if(c.visible&&c.position.distanceTo(player.position)<2){c.visible=false;save.coins+=10;gainXP(100);persist();setTimeout(()=>{c.position.z=player.position.z-150-Math.random()*500;c.visible=true},1500)}});
let sw=player.getObjectByName('steeringWheel');if(sw)sw.rotation.z=THREE.MathUtils.lerp(sw.rotation.z,-steer*.8,.18);let sn=player.getObjectByName('speedNeedle'),rn=player.getObjectByName('rpmNeedle');if(sn)sn.rotation.z=-.5-speed*2;if(rn)rn.rotation.z=-.5-Math.abs(speed)*3;
}
if(cameraMode===0){camera.position.lerp(new THREE.Vector3(player.position.x-.28,2.02,player.position.z+1.18),.22);camera.lookAt(player.position.x-.05,1.35,player.position.z-7)}else if(cameraMode===1){camera.position.lerp(new THREE.Vector3(player.position.x,2.6,player.position.z+2.5),.16);camera.lookAt(player.position.x,1,player.position.z-20)}else{camera.position.lerp(new THREE.Vector3(player.position.x+6,4.2,player.position.z+8),.16);camera.lookAt(player.position.x,1,player.position.z-10)}
}
function loop(){requestAnimationFrame(loop);update();renderer.render(scene,camera)}persist();loop();addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
