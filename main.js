const cur=document.getElementById('cur'),smear=document.getElementById('smear');
let mx=0,my=0,lx=0,ly=0;
document.addEventListener('mousemove',e=>{
  lx=mx;ly=my;mx=e.clientX;my=e.clientY;
  cur.style.left=mx+'px';cur.style.top=my+'px';
  const dx=mx-lx,dy=my-ly;
  const angle=Math.atan2(dy,dx)*180/Math.PI;
  const speed=Math.min(Math.sqrt(dx*dx+dy*dy),40);
  smear.style.left=mx+'px';smear.style.top=my+'px';
  smear.style.transform=`translate(-50%,-50%) rotate(${angle}deg) scaleX(${1+speed/20})`;
  smear.style.opacity=(speed/40)*0.6+'';
});
document.querySelectorAll('a,button,.pc,.sk-box').forEach(el=>{
  el.addEventListener('mouseenter',()=>cur.classList.add('mag'));
  el.addEventListener('mouseleave',()=>cur.classList.remove('mag'));
});

// Ink splash canvas
const canvas=document.getElementById('splash'),ctx=canvas.getContext('2d');
function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
resize();window.addEventListener('resize',resize);
const particles=[];
for(let i=0;i<80;i++){
  const type=Math.random()<0.6?'cyan':'mag';
  particles.push({x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,r:Math.random()*2.5+0.5,life:Math.random()*300,maxLife:300,vx:(Math.random()-0.5)*0.5,vy:(Math.random()-0.5)*0.5,type});
}
function drawSplash(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p=>{
    p.life=(p.life+1)%p.maxLife;p.x+=p.vx;p.y+=p.vy;
    if(p.x<0||p.x>canvas.width)p.vx*=-1;if(p.y<0||p.y>canvas.height)p.vy*=-1;
    const t=p.life/p.maxLife;
    const a=(t<0.15?t/0.15:t>0.85?1-(t-0.85)/0.15:1)*0.07;
    ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle=p.type==='cyan'?`rgba(0,245,255,${a})`:`rgba(255,0,128,${a})`;
    ctx.fill();
  });
  requestAnimationFrame(drawSplash);
}
drawSplash();

// Reveal
const io=new IntersectionObserver(es=>{
  es.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('v');
      e.target.querySelectorAll('.bar-fill').forEach(b=>b.style.width=(b.dataset.v||0)+'%');
      io.unobserve(e.target);
    }
  });
},{threshold:0.15});
document.querySelectorAll('.reveal,.rev-l,.rev-r,.s-eyebrow').forEach(el=>io.observe(el));

// Filter
document.querySelectorAll('.fb').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('.fb').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    const f=b.dataset.f;
    document.querySelectorAll('.pc').forEach(c=>{c.style.display=(f==='all'||(c.dataset.cat||'').includes(f))?'':'none';});
  });
});
// Menu
document.getElementById('menuBtn').addEventListener('click',()=>document.getElementById('nav').classList.toggle('open'));
