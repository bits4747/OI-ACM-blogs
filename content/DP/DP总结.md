---
public: true
---
#DP 
## DP综述

- 最优子结构：把原问题化到**规模更小**的问题后，原问题的最优解一定能从**规模更小**问题的**最优解**推出。
- 无后效性：如果在某个阶段上过程的状态已知，则从此阶段**以后过程的发展变化仅与此阶段的状态有关**，而与过程在此阶段以前的阶段所经历过的状态无关。
- 状态：类似搜索中所说的状态，就是怎么描述求解过程中的一个阶段。希望状态完整而不冗余地定义清楚子问题。
- 为什么动态规划和搜索相比更优秀？我们找出转移模式相同的、本质类似的那些状态，将其合并在一个新状态中，从而减少总的状态数量和转移路径数量。
## 解题套路

- 寻找子问题
- 设计状态描述
- 写出转移规则
- 确定边界

## 线性DP

往往用 $F_{i,s}$ 表示区间 $[1,i]$ 在状态限制 $s$ 下的最优解。 
### 例题
####  [P2501 [HAOI2006] 数字序列](https://www.luogu.com.cn/problem/P2501)
**题意：**
![[Pasted image 20230907214548.png]]

**题解：**

先考虑第一问。若两个数 $a_i,a_j(i<j)$ 可以保留，则 $a_i-a_j\ge i-j$，即 $a_i-i\ge a_j-j$。令 $a_i=a_i-i$，求出最长不降子序列 $max\sum_{i=1}^n f_i$，即为可保留的。

考虑第二问。

最长不降子序列中 $a_i,a_j$ 相邻，则在原序列中 $i,j$ 之间不存在 $k$ 使得 $a_i\le a_k\le a_j$。

![[Pasted image 20230907215439.png]]

我们先把 $i,j$ 之间的数就近挪到边上，这是每个点至少要挪动的距离。

![[Pasted image 20230907215538.png]]

可以发现，当左边一段都在下边界，右边一段都在上边界时最优。

![[Pasted image 20230907220138.png]]

一种证明如下：

如果台阶上的“上升点数目”大于“下降点数目”，那么把台阶下降到和左边台阶一样高；反之，就把台阶上升到和右边台阶一样高。如果有Up = Down的，则台阶向上向下都可以。这个过程始终保证合法、保证代价不增。

这样变化到最后，一定只剩下不超过两块台阶，左边的高 $a_i$，右边的高 $a_j$。

![[Pasted image 20230926192717.gif]]

于是把点按 $f_i$ 分层，求出 $dp_i$ 表示以 $i$ 结尾（$i$ 不变）的最小花费。

$dp_i$ 可从上一层中合法点转移过来，用前后缀和可求出转移代价。

```cpp
#include<bits/stdc++.h>
using namespace std;
#define ll long long
const int N=135005;
const ll inf=1e12;
int n,m,a[N],f[N],p[N],id[N],r,t,ans;
ll sl[N],sr[N],dp[N],mn,sum;
vector<int>s[N];
void add(int k,int x){for(;k<=m;k+=k&-k)if(f[id[k]]<f[x]) id[k]=x;}
int ask(int k){int re=0;for(;k;k-=k&-k)if(f[re]<f[id[k]]) re=id[k];return re;}
int main(){
	scanf("%d",&n);
	for(int i=1;i<=n;++i) scanf("%d",&a[i]),a[i]+=n-i,m=max(m,a[i]);
	for(int i=1;i<=n;++i)
		p[i]=ask(a[i]),f[i]=f[p[i]]+1,add(a[i],i),s[f[i]].push_back(i),ans=max(ans,f[i]);
	a[n+1]=1e9,f[n+1]=ans+1,s[0].push_back(0);
	for(int j=1;j<=n+1;++j){
		dp[j]=inf;
		for(int i:s[f[j]-1]){
			if(i>j) break;
			if(a[i]>a[j]) continue;
			sl[i]=sr[j]=0,mn=inf;
			for(int k=i+1;k<j;++k) sl[k]=sl[k-1]+abs(a[k]-a[i]);
			for(int k=j-1;k>i;--k) sr[k]=sr[k+1]+abs(a[k]-a[j]);
			for(int k=i;k<j;++k) mn=min(mn,sl[k]+sr[k+1]);
			dp[j]=min(dp[j],dp[i]+mn);
		}
	}
	printf("%d\n%lld",n-ans,dp[n+1]);
	return 0;
} 
```

#### [P3336 [ZJOI2013] 话旧](https://www.luogu.com.cn/problem/P3336)
**题意：**

有一个值域为 $[0,N]$ 的连续函数 $f$，满足 $f(0)=f(N)=0$，它的所有极值点在整数处取到，且 **极小值** 均是 $0$，$f$ 在任意 $(x,x+1)$ 上是斜率为 $1$ 或 $−1$ 的一次函数。给定 $K$ 个整点的函数值，求：

1. 有多少个函数满足条件？
2. 满足条件的函数中，求函数的最大值最大能是多少？

**题解：**

因为极小值为 $0$，所以一旦下降就要降到 $0$。

定义 $f_{i,0/1}$ 为到第 $i$ 个点时是上升还是下降的方案数。

1. $f_{i-1,1}\to f_{i,0}$：

确定了两个 $0$ 点，剩下 $k$ 段上升、$k$ 段下降，方案数为 $2^{k-1}$（会形成锯齿状，将 $k$ 段上升分组）。

![[Pasted image 20230908182219.png]]

2. $f_{i-1,0}\to f_{i,0}$：

将橙色线段左移，也就相当于确定了两个 $0$ 点，橙色线段可以在开头也可以在第一个锯齿后，所以乘上 $2$，方案数为 $2^{k}$。（**注意：当第一个点 $y$ 为 $0$ 时第二种情况不行**）。

![[Pasted image 20230908183544.png]]

3. $f_{i-1,1}\to f_{i,1}$：

将橙色段右移，也确定了两个 $0$ 点，方案数为 $2^{k-1}$。

![[Pasted image 20230908184510.png]]

4. $f_{i-1,0}\to f_{i,1}$：

向两边移动橙色线段，确定了两个 $0$ 点，其中左边的橙色线段可以在开头也可以在第一个锯齿后，方案数为 $2^{k}$（**注意：当第一个点 $y$ 为 $0$ 时只能先向上**）。

![[Pasted image 20230908184940.png]]

考虑求最大值。显然两点之间这样取得的极值最大。

![[Pasted image 20230908185302.png]]

但是这样取最大值限制了下一步只能先向下走，是假的。因此，最大值也要区分向下向上。

具体实现细节很多，不再赘述，详见代码。~~（调了一天qwq）~~

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=1e6+5,p=19940417;
#define x first
#define y second
int n,m,c,a,b,k,f[N][2],mx0=-1,mx1=-1,lmx0,lmx1;
pair<int,int>s[N];
int poww(int v,int t){int e=1;while(t){if(t&1)e=1ll*e*v%p; v=1ll*v*v%p,t>>=1;}return e;}
int main(){
	scanf("%d%d",&n,&m);
	for(int i=1;i<=m;++i) scanf("%d%d",&s[i].x,&s[i].y);
	s[++m].x=n,++m,sort(s+1,s+1+m),m=unique(s+1,s+1+m)-(s+1),f[1][1]=1;
	for(int i=2;i<=m;++i){
		lmx0=mx0,lmx1=mx1,mx0=mx1=-1;
		if(s[i-1].y==0) swap(f[i-1][0],f[i-1][1]),lmx0=max(lmx0,lmx1);
		c=(s[i].x-s[i-1].x-abs(s[i-1].y-s[i].y))/2;
		if(!c){
			if(s[i-1].y<s[i].y) f[i][0]=f[i-1][0],mx0=max(lmx0,s[i].y);
			else f[i][1]=f[i-1][0]+f[i-1][1],mx1=max(lmx1,lmx0);
			continue;
		}
		k=(s[i].x-s[i-1].x-s[i-1].y-s[i].y)/2;
		if(~lmx0) mx1=max(lmx0,max(s[i-1].y,s[i].y)+c);
		if(k<0){f[i][1]=f[i-1][0];continue;}
		mx0=max(max(lmx0,lmx1),s[i].y);
		if(k==0){f[i][1]=f[i-1][0],f[i][0]=f[i-1][0]+f[i-1][1];continue;}
		a=poww(2,k-1),b=a*2%p,mx1=max(mx1,max(lmx1,k+s[i].y));
		if(s[i].y) f[i][0]=(1ll*f[i-1][1]*a%p+1ll*f[i-1][0]*(s[i-1].y?b:a)%p)%p;
		f[i][1]=(1ll*f[i-1][0]*(s[i-1].y?b:a)%p+1ll*f[i-1][1]*a%p)%p;
		if(lmx0==-1) mx0=max(mx0,k);
		else if(s[i-1].y>s[i].y) mx0=max(mx0,max(lmx0,s[i-1].y+c-s[i].y));
		else mx0=max(mx0,max(lmx0,c));
	}
	if(max(f[m][0],f[m][1])==0) return 0;
	printf("%d %d",max(f[m][0],f[m][1]),max(mx0,mx1));
	return 0;
}
```

[P4310	绝世好题](https://www.luogu.com.cn/problem/P4310)  
[P1944 最长括号匹配](https://www.luogu.com.cn/problem/P1944)   
[P1772	[ZJOI2006]物流运输](https://www.luogu.com.cn/problem/P1772)  

## 背包DP
- 01背包
- 完全背包
- 多重背包
    - 二进制拆分
    - 斜率优化
- 分组背包
- 树形背包 （通常可解依赖背包[[树形DP#树上背包]]）
### 模板
#### 01、完全、多重背包
```cpp
int w[maxn],v[maxn],num[maxn],dp[maxn],V,n;
//w:重量 v:价值 num:数量  V:容量
void ZeroOnePack(int w, int v){  //01背包
	for (int j = V; j >= w; j--)
		dp[j] = max(dp[j], dp[j - w] + v);
}
void CompletePack(int w, int v){//完全背包
	for (int j = w; j <= V; j++)
		dp[j] = max(dp[j], dp[j - w] + v);
}
//多重背包
void MultiplePack(int w, int v, int num){
	if (w * num >= V) CompletePack(w, v);
	else{
		int k = 1;
		while (k < num){
			ZeroOnePack(k*w, k*v);
			num -= k;
			k <<= 1;
		}
		ZeroOnePack(num*w, num*v);
	}
}
for(int i=1;i<=n;i++)
    MultiplePack(w[i],v[i],num[i]);    
```
#### 斜率优化多重背包
```cpp
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
```
#### 分组背包
![[Pasted image 20230911104822.png]]
### 例题  
#### ★ [P5289 [十二省联考 2019] 皮配](https://www.luogu.com.cn/problem/P5289)
**形式化题意：**
![[Pasted image 20230911105111.png]]

**题解：**

首先，可以非常暴力地记录三种性状的重量来 dp。

考虑到每颗豆子两类相对性状都要二选一，可以只记录 $f_{i,j}$ 表示黄色重量为 $i$，圆粒重量为 $j$ 的方案数来 dp。

可以发现，忽略特殊的豆子，其他豆子的黄绿和圆皱这两类相对性状是相互独立的，可以分别求出 $f_i,g_i$，统计答案时相乘即可。

因为特殊豆子数量很少，容易想到，可以单独暴力处理特殊的豆子。记 $dp_{i,j}$ 表示黄色特殊豆荚（内含至少一个特殊豆子的豆荚）重量为 $i$，圆粒特殊豆子重量为 $j$ 的方案数。统计答案时枚举 $i,j$ 再乘上合法的 $f,g$。

此题很妙的把 $f,g$ 拆开，还需要背包合并。代码实现的难点在于如何优雅地求出 $dp$。

由于 $dp_{i,j}$ 第一维影响的尺度是豆荚，常规滚动数组的写法会将当前豆荚和之前的 $dp$ 值搞混。因此，可以分成两个数组 $ye,gr$，表示当前豆荚为黄或绿的 $dp$ 值，算完整个豆荚后再合并。

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=1005,M=2505,X=10005,Y=305,P=998244353;
int T,n,c,c0,c1,d0,d1,k,b[N],s[N],sc[N],x,t,xc[N],p[N],bn[N],bc[N];
int f[X],g[X],sum,sumf,sumg,ss,ssc,ye[X][Y],gr[X][Y],cntf,cntg,ans;
vector<int>d[N];
void work(){
	scanf("%d%d%d%d%d%d",&n,&c,&c0,&c1,&d0,&d1),t=sum=sumf=sumg=ss=ssc=ans=0;
	for(int i=1;i<=c;++i) sc[i]=bc[i]=0,d[i].clear();
	for(int i=1;i<=n;++i) bn[i]=0;
	for(int i=1;i<=n;++i) scanf("%d%d",&b[i],&s[i]),sc[b[i]]+=s[i],sum+=s[i];
	scanf("%d",&k),memset(f,0,sizeof(f)),memset(g,0,sizeof(g)),f[0]=g[0]=1;
	for(int i=1;i<=k;++i)
		scanf("%d",&x),scanf("%d",&p[x]),bn[x]=1,bc[b[x]]=1,d[b[x]].push_back(x);
	for(int i=1;i<=c;++i)if(bc[i]) xc[++t]=i;
	for(int i=1;i<=c;++i)if(!bc[i]&&sc[i]){
		sumf+=sc[i];
		for(int j=min(c0,sumf);j>=sc[i];--j){
			if(sumf-j>c1) break;
			(f[j]+=f[j-sc[i]])%=P;
		}
		for(int j=sumf-c1-1;j>=0;--j) f[j]=0;
	}
	for(int i=1;i<=c0;++i) (f[i]+=f[i-1])%=P;
	for(int i=1;i<=n;++i)if(!bn[i]){
		sumg+=s[i];
		for(int j=min(d0,sumg);j>=s[i];--j){
			if(sumg-j>d1) break;
			(g[j]+=g[j-s[i]])%=P;
		}
		for(int j=sumg-d1-1;j>=0;--j) g[j]=0;
	}
	for(int i=1;i<=d0;++i) (g[i]+=g[i-1])%=P;
	memset(gr,0,sizeof(gr)),memset(ye,0,sizeof(ye)),gr[0][0]=ye[0][0]=1;
	for(int i=1;i<=t;++i){
		ssc+=sc[xc[i]],ssc=min(ssc,c0);
		for(int x:d[xc[i]]){
			ss+=s[x],ss=min(ss,d0);
			if(p[x]==1) 
				for(int j=ssc;j>=0;--j){
					for(int o=ss;o>=s[x];--o) ye[j][o]=ye[j][o-s[x]];
					for(int o=s[x]-1;o>=0;--o) ye[j][o]=0;
				}
			if(p[x]>1) 
				for(int j=ssc;j>=0;--j)
					for(int o=ss;o>=s[x];--o) (ye[j][o]+=ye[j][o-s[x]])%=P;
			if(p[x]==3) 
				for(int j=ssc;j>=0;--j){
					for(int o=ss;o>=s[x];--o) gr[j][o]=gr[j][o-s[x]];
					for(int o=s[x]-1;o>=0;--o) gr[j][o]=0;
				}
			if(p[x]<2) 
				for(int j=ssc;j>=0;--j)
					for(int o=ss;o>=s[x];--o) (gr[j][o]+=gr[j][o-s[x]])%=P;
		}
		for(int j=ssc;j>=sc[xc[i]];--j)for(int o=0;o<=ss;++o) ye[j][o]=ye[j-sc[xc[i]]][o];
		for(int j=sc[xc[i]]-1;j>=0;--j)for(int o=0;o<=ss;++o) ye[j][o]=0;
		for(int j=0;j<=ssc;++j)for(int o=0;o<=ss;++o) (gr[j][o]+=ye[j][o])%=P,ye[j][o]=gr[j][o];
	}
	for(int i=0;i<=ssc;++i){
		if(sum-c1-i>c0-i) continue;
		for(int j=0;j<=ss;++j){
			if(sum-d1-j>d0-j) continue;
			(ans+=1ll*(f[c0-i]-(sum-c1-i>0?f[sum-c1-i-1]:0)+P)*
			(g[d0-j]-(sum-d1-j>0?g[sum-d1-j-1]:0)+P)%P*ye[i][j]%P)%=P;
		}
	}
	printf("%d\n",ans);
}
int main(){
	scanf("%d",&T);
	while(T--) work();
	return 0;
}
```

[P4158	[SCOI2009]粉刷匠](https://www.luogu.com.cn/problem/P4158)   
[P1284	三角形牧场](https://www.luogu.com.cn/problem/P1284)  
[P1156	垃圾陷阱](https://www.luogu.com.cn/problem/P1156)  
[P1941 飞扬的小鸟](https://www.luogu.com.cn/problem/P1941)  
[P1282	多米诺骨牌](https://www.luogu.com.cn/problem/P1282)   
[P5322	[BJOI2019]排兵布阵](https://www.luogu.com.cn/problem/P5322)     
[P2224	[HNOI2001]产品加工](https://www.luogu.com.cn/problem/P2224)   
[P3188	[HNOI2007]梦幻岛宝珠](https://www.luogu.com.cn/problem/P3188)  
[P4141	消失之物](https://www.luogu.com.cn/problem/P4141)   
[P2340 [USACO03FALL]Cow Exhibition G](https://www.luogu.com.cn/problem/P2340)  
[P4095 [HEOI2013]Eden的新背包问题](https://www.luogu.com.cn/problem/P4095)   
[P2851	[USACO06DEC]The Fewest Coins G](https://www.luogu.com.cn/problem/P2851) 

## 区间DP

依照子区间来定义子问题。
大区间的求解依赖于其内部小区间的求解。
往往用$F_{l,r,s}$表示区间$[l,r]$在状态限制$s$下的最优解。
按照区间长度从小到大依次求解。
单点构成的区间或空区间无需递归。

**TIPS ：尝试下面三种转移思路**
- $F_{l,r,s} = max{F_{l+1,r,s'},F_{l,r-1,s'}}$
- $F_{l,r,s} = max_{l\leq k<r}{f(F_{l,k,s'},F_{k+1,r,s'})}$
- $F_{l,r,s} = max_{l\leq k\leq r}{f(F_{l,k,s'},F_{k,r,s'})}$
### 例题 
#### [P2466 [SDOI2008] Sue 的小球](https://www.luogu.com.cn/problem/P2466)

这题非常典。时间对分数有影响，我们可以在转移时直接减去当前全局减少的分数，而非处理到时再算具体的分数。

所以我们应该记住：对于当前决策影响未来的问题 -> 现在算将来的影响再进行DP

[code](https://www.luogu.com.cn/record/124420218)

[P1040	加分二叉树](https://www.luogu.com.cn/problem/P1040)  
[P2890 [USACO07OPEN]Cheapest Palindrome G](https://www.luogu.com.cn/problem/P2890)   
[P4170 [CQOI2007]涂色](https://www.luogu.com.cn/problem/P4170)     
[UVA1437 String painter](https://www.luogu.com.cn/problem/UVA1437)   
[CF149D Coloring Brackets](https://www.luogu.com.cn/problem/CF149D)   
[P5851 [USACO19DEC]Greedy Pie Eaters P](https://www.luogu.com.cn/problem/P5851)   
[UVA1629 切蛋糕 Cake slicing](https://www.luogu.com.cn/problem/UVA1629)   
[P3205	[HNOI2010]合唱队](https://www.luogu.com.cn/problem/P3205)  

## [树形DP](树形DP.md)

## [状压DP](状压DP.md)

## [数位DP](数位DP.md)

## [SOS DP](SOS%20DP.md)

## [DP优化](DP优化.md)

## [dp 套 dp](dp%20套%20dp.md)

## [博弈论](博弈论.md)
