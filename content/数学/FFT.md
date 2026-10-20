---
public: true
---
#数学 

[这篇学的，很详细易懂，建议多次重修](https://www.luogu.com.cn/blog/command-block/fft-xue-xi-bi-ji)
## 模板
### [P3803 【模板】多项式乘法（FFT）](https://www.luogu.com.cn/problem/P3803)
```cpp
#include<bits/stdc++.h>
using namespace std;
const double pi=acos(-1);
const int N=3e6;
struct node{
	double x,y;
	node (double xx=0,double yy=0){x=xx,y=yy;}
	node operator +(const node &b)const{return node(x+b.x,y+b.y);}
	node operator -(const node &b)const{return node(x-b.x,y-b.y);}
	node operator *(const node &b)const{return node(x*b.x-y*b.y,x*b.y+y*b.x);}
}f[N],p[N];
int n,m,tr[N];
void fft(node *f,bool fl){
	for(int i=0;i<n;++i) if(i<tr[i]) swap(f[i],f[tr[i]]);
	int len;node t;
	for(int p=2;p<=n;p<<=1){
		len=p>>1;node e(cos(2*pi/p),sin(2*pi/p)*(fl?-1:1));
		for(int k=0;k<n;k+=p){//k+=p
			node buf(1,0);
			for(int i=k;i<k+len;++i) t=buf*f[i+len],f[i+len]=f[i]-t,f[i]=f[i]+t,buf=buf*e;
		}
	}
}
int main(){
	scanf("%d%d",&n,&m);
	for(int i=0;i<=n;++i) scanf("%lf",&f[i].x);
	for(int i=0;i<=m;++i) scanf("%lf",&p[i].x);
	for(m+=n,n=1;n<=m;n<<=1);//<=?
	for(int i=0;i<n;++i) tr[i]=(tr[i>>1]>>1)|(i&1?n>>1:0);
	fft(f,0),fft(p,0);
	for(int i=0;i<n;++i) f[i]=f[i]*p[i];
	fft(f,1);
	for(int i=0;i<=m;++i) printf("%d ",(int)(f[i].x/n+0.49));
	return 0;
}
```
### 三次变两次优化
![[Pasted image 20230913101626.png]]
```cpp
int main(){
	scanf("%d%d",&n,&m);
	for(int i=0;i<=n;++i) scanf("%lf",&f[i].x);
	for(int i=0;i<=m;++i) scanf("%lf",&f[i].y);
	for(m+=n,n=1;n<=m;n<<=1);//<=?
	for(int i=0;i<n;++i) tr[i]=(tr[i>>1]>>1)|(i&1?n>>1:0);
	fft(f,1);
	for(int i=0;i<n;++i) f[i]=f[i]*f[i];
	fft(f,-1);
	for(int i=0;i<=m;++i) printf("%d ",(int)(f[i].y/2/n+0.49));
	return 0;
}
```
### [P1919 【模板】A*B Problem 升级版（FFT 快速傅里叶变换）](https://www.luogu.com.cn/problem/P1919)

高精度乘法。

[code](https://www.luogu.com.cn/record/85745188)
## 应用
FFT就是个求多项式卷积的工具人，背好板子后重在前期的转化。
### 拆式子
#### [P3723 [AH2017/HNOI2017]礼物](https://www.luogu.com.cn/problem/P3723) 

![[Pasted image 20230913101658.png]]

<center><font size=5 color=red>总结：拆式+破环+翻转数列+卷积</font></center>

[code](https://www.luogu.com.cn/record/85902430)

#### [P3338 [ZJOI2014]力](https://www.luogu.com.cn/problem/P3338)

![[Pasted image 20230913101714.png]]

[code](https://www.luogu.com.cn/record/93873013)

### 转化+容斥
#### [TSUM - Triple Sums](https://www.luogu.com.cn/problem/SP8372)

![[Pasted image 20230913101725.png]]
<center><font size=5 color=red>总结：卷积+容斥+分类讨论</font></center>

[code](https://www.luogu.com.cn/record/93944896)
### [Super Rooks on Chessboard](https://www.luogu.com.cn/problem/UVA12633)
第一道黑题祭。~~（UVA onlinejudge 真的垃圾）~~ 

考虑到只有行列上没有车的格子才可能符合要求。

有可以观察到，一条左至右对角线上的点 $(x,y)$ ， $x+y$ 相等。

多项式 $f[i]$ 表示第 $i$ 行是否合法， $p[i]$ 表示第 $i$ 列是否合法， $x[i]$ 表示 $x+y=i$ 的对角线是否有车。
$$\sum_{i=2}^{i\leq r+c,x[i]\neq0}f*p$$

<center><font size=5 color=red>总结：转化+容斥+卷积  | 具有思维性</font></center>

[code](https://www.luogu.com.cn/record/93868083)
