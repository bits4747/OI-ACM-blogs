---
public: true
---
#DP 
## 基本形态
当前状态的所有值可以从上一个状态的某个连续的段的值得到，要对这个连续的段进行 RMQ 操作，相邻状态的段的左右区间满足非降、非升的关系（单调性）。
## 例题
### [P2569 [SCOI2010]股票交易](https://www.luogu.com.cn/problem/P2569)
最近 $\text{lxhgww}$ 又迷上了投资股票，通过一段时间的观察和学习，他总结出了股票行情的一些规律。

通过一段时间的观察，$\text{lxhgww}$ 预测到了未来 $T$ 天内某只股票的走势，第 $i$ 天的股票买入价为每股 $AP_i$，第 $i$ 天的股票卖出价为每股 $BP_i$（数据保证对于每个 $i$，都有 $AP_i \geq BP_i$），但是每天不能无限制地交易，于是股票交易所规定第 $i$ 天的一次买入至多只能购买 $AS_i$ 股，一次卖出至多只能卖出 $BS_i$ 股。

另外，股票交易所还制定了两个规定。为了避免大家疯狂交易，股票交易所规定在两次交易（某一天的买入或者卖出均算是一次交易）之间，至少要间隔 $W$ 天，也就是说如果在第 $i$ 天发生了交易，那么从第 $i+1$ 天到第 $i+W$ 天，均不能发生交易。同时，为了避免垄断，股票交易所还规定在任何时间，一个人的手里的股票数不能超过 $\text{MaxP}$。

在第 $1$ 天之前，$\text{lxhgww}$ 手里有一大笔钱（可以认为钱的数目无限），但是没有任何股票，当然，$T$ 天以后，$\text{lxhgww}$ 想要赚到最多的钱，聪明的程序员们，你们能帮助他吗？
```
f[i][j]--第i天、有j股的最大钱数
```

```cpp
#include<bits/stdc++.h>
using namespace std;
long long n,m,w,f[2005][2005],q[2005],t,h,ap,bp,as,bs,fr;
int main() {
	cin>>n>>m>>w;
	memset(f,128,sizeof(f));
	f[0][0]=0;
	for(int i=1; i<=n; ++i){
		scanf("%lld%lld%lld%lld",&ap,&bp,&as,&bs);
		fr=max(i-w-1,(long long)0),h=t=0;
		for(int j=0; j<=m; ++j) {//买入
			f[i][j]=max(f[i][j],f[i-1][j]);//不买
        	//从上一次交易处转移
			while(h<t&&f[fr][j]+j*ap>=f[fr][q[t-1]]+q[t-1]*ap) t--;
			while(h<t&&q[h]+as<j) ++h;
			q[t++]=j;
			f[i][j]=max(f[i][j],f[fr][q[h]]-(j-q[h])*ap);
		}
		h=t=0;
		for(int j=m; j>=0; --j) {//卖出 大致同上
			while(h<t&&f[fr][j]+j*bp>=f[fr][q[t-1]]+q[t-1]*bp) t--;
			while(h<t&&j+bs<q[h]) ++h;
			q[t++]=j;
			f[i][j]=max(f[i][j],f[fr][q[h]]+(q[h]-j)*bp);
		}
	}
	cout<<f[n][0];//一张不剩是王道
	return 0;
}
```
### [#10178 「一本通 5.5 例 4」旅行问题](https://loj.ac/problem/10178)
John 打算驾驶一辆汽车周游一个环形公路。公路上总共有 n 个车站，每站都有若干升汽油（有的站可能油量为零），每升油可以让汽车行驶一千米。John必须从某个车站出发，一直按顺时针（或逆时针）方向走遍所有的车站，并回到起点。在一开始的时候，汽车内油量为零，John每到一个车站就把该站所有的油都带上（起点站亦是如此），行驶过程中不能出现没有油的情况。

任务：判断以每个车站为起点能否按条件成功周游一周。

输入：第一行是一个整数 n ，表示环形公路上的车站数；

接下来 n 行，每行两个整数 pi,dipi,di，分别表示表示第 ii 号车站的存油量和第 i 号车站到下一站的距离。

输出：输出共 n 行，如果从第 i 号车站出发，一直按顺时针（或逆时针）方向行驶，能够成功周游一圈，则在第 i 行输出TAK，否则输出NIE。
```cpp
巧妙转化：若当前位置其后面共n个位置中任意一个前缀和小于上一个位置的前缀和，则这个位置不可行 
```
```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=2e6+5;
long long n,a[N],q[N],h,t,p,d,fp,ld,aa[N];
bool b[N>>1];
int main() {
	scanf("%lld",&n);
	for(int i=1;i<=n;++i){
		scanf("%lld%lld",&p,&d),a[i]=a[i+n]=p-d,aa[i]=aa[i+n]=p-ld,ld=d;
		if(i==1) fp=p;
	}
	aa[1]=aa[1+n]=fp-ld;
	for(int i=1;i<=2*n;++i) a[i]+=a[i-1];
	h=t=1;
	for(int i=1;i<=2*n;++i){
		while(h<=t&&a[i]<=a[q[t]]) --t;
		q[++t]=i;
		while(h<=t&&q[h]<i-n) ++h;
		if(i>=n&&a[q[h]]>=a[i-n]) b[i-n+1]=1;
	}
	for(int i=2*n;i>=1;--i) aa[i]+=aa[i+1];
	h=t=1,q[1]=n+1;
	for(int i=2*n;i>=1;--i){
		while(h<=t&&aa[i]<=aa[q[t]]) --t;
		q[++t]=i;
		while(h<=t&&q[h]>i+n) ++h;
		if(i<=n+1&&aa[q[h]]>=aa[i+n]) b[i-1]=1;
	}
	for(int i=1;i<=n;++i){
		if(b[i]) printf("TAK\n");
		else printf("NIE\n");
	}
	return 0;
}
```
### [P5665 [CSP-S2019] 划分](https://www.luogu.com.cn/blog/kskun/solution-p5665)
## 真假head
### [NFOJ 河床](http://47.112.32.87/contest/176/problem/6)
地理学家们经常要对一段河流进行测量分析。他们从上游开始向下游方向等距离地选择了n(≤30000)个点测量水位深度。得到一组数据d1，d2，……，dn，回到实验室后数据分析员根据需要对数据进行分析，发掘隐藏在数据背后的规律。最近，乌龙博士发现某种水文现象与河床地势有关，于是他指示他手下的分析员要找出一段河流中最大高低起伏差不超过k(≤100)的最长一段。这看似一个复杂问题，由于任务紧急，分析员来求助于你，并告诉你博士的所有数据都精确到个位。
```cpp
#include<bits/stdc++.h>
using namespace std;
long long n,k,a[30005],q1[30005],t1,h1,q2[30005],t2,h2,rh=1,ans;
int main() {
	cin>>n>>k;
	for(int i=1;i<=n;++i) scanf("%lld",&a[i]);
	for(int i=1;i<=n;++i){
		while(t1>h1&&a[i]>=a[q1[t1-1]]) t1--;//递减--max 
		q1[t1++]=i;
		while(t2>h2&&a[i]<=a[q2[t2-1]]) t2--;//递增--min 
		q2[t2++]=i;
		while(a[q1[h1]]-a[q2[h2]]>k&&h1<t1&&h2<t2){
			rh++;
			if(q1[h1]<rh) h1++;
			if(q2[h2]<rh) h2++;
		}
		ans=max(ans,i-rh+1);
	}
	cout<<ans;
	return 0;
}
```
### [P3522 [POI2011]TEM-Temperature](https://www.luogu.com.cn/problem/P3522)

某国进行了连续 $n$ ( $1 \le n \le 1,000,000$）天的温度测量，测量存在误差，测量结果是第 $i$ 天温度在 $[l_i,r_i]$ 范围内。求最长的连续的一段，满足该段内可能温度不降。
```cpp
#include<bits/stdc++.h>
using namespace std;
int n,x[1000005],y[1000005],q[1000005],h,t,rh,ans;
int main() {
	cin>>n;
	for(int i=1; i<=n; ++i) cin>>x[i]>>y[i];
	for(int i=1; i<=n; ++i) {
		while(h<t&&y[i]<x[q[h]]) ans=max(ans,i-rh),rh=q[h]+1,++h;
		while(h<t&&x[i]>=x[q[t-1]]) --t;
		q[t++]=i;
	}
	cout<<ans;
	return 0;
}
```


## 单调队列优化多重背包
### 时间复杂度  O（nW）
![[Pasted image 20230926192713.png]]
### 例题  [P1776 宝物筛选](https://www.luogu.com.cn/problem/P1776)
```cpp
#include<bits/stdc++.h>
using namespace std;
int n,W,v,w,m,lf[100005],f[100005],q[100005],h,t;
int main(){
	cin>>n>>W;
	for(int i=1;i<=n;++i){
		scanf("%d%d%d",&v,&w,&m);
		for(int j=1;j<=W;++j) lf[j]=f[j];
		for(int y=0;y<w;++y){
			h=t=0;
			for(int j=y;j<=W;j+=w){
				while(h<t&&lf[j]>=lf[q[t-1]]+(j-q[t-1])/w*v) --t;
				q[t++]=j;
				while(h<t&&q[h]<j-w*m) ++h;
				f[j]=max(f[j],lf[q[h]]+(j-q[h])/w*v);
			}
		}
	}
	cout<<f[W];
	return 0;
}
```
