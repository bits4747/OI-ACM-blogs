---
public: true
---
#DP 
## 斜率优化基础
### 例题引入 [#10191.打印文章](https://loj.ac/p/10191)
给出 $N$ 个单词，每个单词有个非负权值 $C_{i}$ ，现要将它们分成连续的若干段，每段的代价为此段单词的权值和的平方，还要加一个常数 $M$，即 $(\sum C_{i})^2+M$ 。

现在想求出一种最优方案，使得总费用之和最小。

![[Pasted image 20230925144637.png]]

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=5e5+5;
long long n,m,c[N],q[N],f[N],h,t,j;
long long Y(long long n1,long long n2){return f[n1]+c[n1]*c[n1]-(f[n2]+c[n2]*c[n2]);} 
int main(){
	while(scanf("%lld%lld",&n,&m)!=EOF){
		for(int i=1;i<=n;++i) scanf("%lld",&c[i]),c[i]+=c[i-1];
		h=t=1,q[1]=0;
		for(int i=1;i<=n;++i){
			while(h<t&&Y(q[h+1],q[h])<=2*c[i]*(c[q[h+1]]-c[q[h]])) ++h;
			j=q[h],f[i]=f[j]+(c[i]-c[j])*(c[i]-c[j])+m;
			while(h<t&&Y(i,q[t])*(c[q[t]]-c[q[t-1]])<=Y(q[t],q[t-1])*(c[i]-c[q[t]])) --t;
			q[++t]=i;
		}
		printf("%lld\n",f[n]);
	}
	return 0;
}
```
1. 比较斜率最好移项用乘法表示，避免出现精度、除以 $0$ 等神奇情况！
2. 乘法表示时注意移项时不等式的正负和符号，能用正就正，有负易错，统一大减小！
3. 注意队列至少有一个点（毕竟两点才有一条直线）-->  h < t
4. 要先把原点 O 放入队列-->h=t=1,q[1]=0;                                    
------------

### 例题引入 玩具装箱
(此板块选择性看一看，可忽略)
(引用+修改自OIWIKI)

   有 $n$ 个玩具，第 $i$ 个玩具价值为 $c_i$。要求将这 $n$ 个玩具排成一排，分成若干段。对于一段 $[l,r]$，它的代价为 $(r-l+\sum_{i=l}^r c_i-L)^2$。其中 $L$ 是一个常量，求分段的最小代价。 
   $1\le n\le 5\times 10^4, 1\le L, c_i\le 10^7$。

#### 朴素的 DP 做法

令 $f_i$ 表示前 $i$ 个物品，分若干段的最小代价。

状态转移方程：$f_i=\min_{j<i}\{f_j+(i-(j+1)+pre_i-pre_j-L)^2\}=\min_{j<i}\{f_j+(pre_i-pre_j+i-j-1-L)^2\}$。

其中 $pre_i$ 表示前 $i$ 个数的和，即 $\sum_{j=1}^i c_j$。

该做法的时间复杂度为 $O(n^2)$，无法解决本题。

#### 优化

考虑简化上面的状态转移方程式：令 $s_i=pre_i+i,L'=L+1$，则 $f_i=\min_{j<i}\{f_j+(s_i-s_j-L')^2\}$。

将与 $j$ 无关的移到外面，我们得到

$$
f_i - (s_i-L')^2=\min_{j<i}\{f_j+s_j^2 + 2s_j(L'-s_i) \} 
$$

考虑一次函数的斜截式 $y=kx+b$，将其移项得到 $b=y-kx$。我们将与 $j$ 有关的信息表示为 $y$ 的形式，把同时与 $i,j$ 有关的信息表示为 $kx$，把要最小化的信息（与 $i$ 有关的信息）表示为 $b$，也就是截距。具体地，设

$$
\begin{aligned}
x_j&=s_j\\
y_j&=f_j+s_j^2\\
k_i&=-2(L'-s_i)\\
b_i&=f_i-(s_i-L')^2\\
\end{aligned}
$$

则转移方程就写作 $b_i = \min_{j<i}\{ y_j-k_ix_j \}$。我们把 $(x_j,y_j)$ 看作二维平面上的点，则 $k_i$ 表示直线斜率，$b_i$ 表示一条过 $(x_j,y_j)$ 的斜率为 $k_i$ 的直线的截距。问题转化为了，选择合适的 $j$（$1\le j<i$），最小化直线的截距。

容易发现，可能让 $b_i$ 取到最小值的点一定在下凸壳上，且 $k_i$ 需要大于凸包上的斜率，而在本题中 $k_i$ 随 $i$ 的增加而递增，因此我们可以单调队列维护凸包。

这样我们就将 DP 的复杂度优化到了 $O(n)$。
```cpp
#include<bits/stdc++.h>
using namespace std;
long long n,L,t[50005],c[50005],f[50005],q[50005],l=1,r=1;//注意f[1]=0要放入队列！！！ 
long long B(long long x){return c[x]+L+1;}
long long Y(long long x){return f[x]+B(x)*B(x);}
int main(){
	scanf("%lld%lld",&n,&L);
	for(int i=1;i<=n;++i) scanf("%lld",&c[i]),c[i]+=c[i-1];
	for(int i=1;i<=n;++i) c[i]+=i;
	for(int i=1;i<=n;++i){
		while(l<r&&Y(q[l+1])-Y(q[l])<=2*c[i]*(B(q[l+1])-B(q[l]))) ++l;
		f[i]=f[q[l]]+(c[i]-B(q[l]))*(c[i]-B(q[l]));
		while(l<r&&(Y(i)-Y(q[r]))*(B(q[r])-B(q[r-1]))<=(Y(q[r])-Y(q[r-1]))*(B(i)-B(q[r]))) --r;
		q[++r]=i;
	}
	cout<<f[n];
	return 0;
}
```
### 概括(从这继续)：

1. 将初始状态入队。
2. 每次使用一条和 $i$ 相关的直线 $f(i)$ 去切维护的凸包，使凸包内两点间的斜率大于/小于和 $i$ 相关的直线 $f(i)$ ，找到最优决策，更新 $dp_i$。
3. 加入状态 $dp_i$。如果一个状态（即凸包上的一个点）在 $dp_i$ 加入后不再是凸包上的点，需要在 $dp_i$ 加入前将其剔除。

### 好题之 [P6302 [NOI2019] 回家路线 加强版](https://www.luogu.com.cn/problem/P6302)
猫国的铁路系统中有 $n$ 个站点，从 $1 - n$ 编号。小猫准备从 $1$ 号站点出发，乘坐列车回到猫窝所在的 $n$ 号站点。它查询了能够乘坐的列车，这些列车共 $m$ 班，从 $1 - m$ 编号。小猫将在 $0$ 时刻到达 $1$ 号站点。对于 $i$ 号列车，它将在时刻 $p_i$ 从站点 $x_i$ 出发，在时刻 $q_i$ 直达站点 $y_i$，小猫只能在时刻 $p_i$ 上 $i$ 号列车，也只能在时刻 $q_i$ 下 $i$ 号列车。小猫可以通过多次换乘到达 $n$ 号站点。一次换乘是指对于两班列车，假设分别为 $u$ 号与 $v$ 号列车，若 $y_u = x_v$ 并且 $q_u \leq p_v$，那么小猫可以乘坐完 $u$ 号列车后在 $y_u$ 号站点等待 $p_v - q_u$ 个时刻，并在时刻 $p_v$ 乘坐 $v$ 号列车。

小猫只想回到猫窝并且减少途中的麻烦，对此它用烦躁值来衡量。

 - 小猫在站点等待时将增加烦躁值，对于一次 $t (t \geq 0)$ 个时刻的等待，烦躁值将增加 $At^2 + Bt + C$，其中 $A, B,C$ 是给定的常数。注意：小猫登上第一班列车前，即从 $0$ 时刻起停留在 $1$ 号站点的那些时刻也算作一次等待。

 - 若小猫最终在时刻 $z$ 到达 $n$ 号站点，则烦躁值将再增加 $z$。

形式化地说，若小猫共乘坐了 $k$ 班列车，依次乘坐的列车编号可用序列 $s_1, s_2, \cdots , s_k$ 表示。该方案被称作一条可行的回家路线，当且仅当它满足下列两个条件：

 - $x_{s1} = 1,y_{sk} = n$

 - 对于所有 $j (1 \leq j < k)$，满足 $y_{sj} = x_{s_{j+1}}$ 且 $q_{sj}\leq p_{s_{j+1}}$ 

对于该回家路线，小猫得到的烦躁值将为：

$$q_{s_k}+(A\times p_{s_1}^2+B\times p_{s_1}+C)+\sum_{j=1}^{k-1}(A(p_{s_{j+1}}-q_{s_j})^2+B(p_{s_{j+1}}-q_{s_j})+C)$$

小猫想让自己的烦躁值尽量小，请你帮它求出所有可行的回家路线中，能得到的最 小的烦躁值。题目保证至少存在一条可行的回家路线。


对于所有的测试点，保证 $2\le n\le 10^5$，$1\le m\le  10^6$，$0\le 
A\le 10$，$0\le B,C\le 10^7$，$1\le x_i,y_i\le n$，$x_i\neq y_i$，$0\le p_i<q_i\le 4\times 10^4$。
```cpp
#include<bits/stdc++.h>
using namespace std;
const int M=1e6+5,N=1e5+5,S=40005;
long long n,m,A,B,C,f[M],h[N],t[N],hh,ans=1e18,mn,u,v,ss;//f--坐i列车最小烦恼值 
struct subw{
	long long x,y,p,q;
}b[M]; 
bool cmp(subw aa,subw bb){return aa.p<bb.p;}//按起始时间排序  （p为斜率，递增） 
vector<int>buc[S],Q[N];//buc--结束时间桶   Q--起点站的队列（放入可用列车编号） 
long long Y(long long x,long long y){return f[x]+A*b[x].q*b[x].q-(B+1)*b[x].q-(f[y]+A*b[y].q*b[y].q-(B+1)*b[y].q);}
long long X(long long x,long long y){return b[x].q-b[y].q;}// Y/X为两点间斜率，递增（下凸包） 
int main(){
	scanf("%lld%lld%lld%lld%lld",&n,&m,&A,&B,&C);
	for(int i=1;i<=m;++i)
		scanf("%lld%lld%lld%lld",&b[i].x,&b[i].y,&b[i].p,&b[i].q),mn=max(mn,max(b[i].x,b[i].y));//最大站点编号 
	sort(b+1,b+1+m,cmp);
	for(int i=1;i<=mn;++i) t[i]=-1;
	b[0].y=1,buc[0].push_back(0);
	for(int i=1;i<=m;++i){
		for(;hh<=b[i].p;++hh){
			for(int o=0;o<buc[hh].size();++o){
				v=buc[hh][o],u=b[v].y;
				while(h[u]<t[u]&&Y(v,Q[u][t[u]])*X(Q[u][t[u]],Q[u][t[u]-1])<=Y(Q[u][t[u]],Q[u][t[u]-1])*X(v,Q[u][t[u]]))
					--t[u];
				if(t[u]==Q[u].size()-1)
					++t[u],Q[u].push_back(v);
				else Q[u][++t[u]]=v;
			}
		}
		u=b[i].x;
		while(h[u]<t[u]&&Y(Q[u][h[u]+1],Q[u][h[u]])<=2*A*b[i].p*X(Q[u][h[u]+1],Q[u][h[u]]))
			++h[u];
		if(h[u]<=t[u]){//可以乘坐本次列车，更新 
			v=Q[u][h[u]],ss=b[i].p-b[v].q;
			f[i]=f[v]+A*ss*ss+B*ss+C;
			buc[b[i].q].push_back(i);//放入结束时间桶
			if(b[i].y==n) ans=min(ans,f[i]+b[i].q);//可到达终点n更新答案 
		}
	}
	cout<<ans;
	return 0;
}
```
### 好题之 [「一本通 5.6 例 4」Cats Transport](https://loj.ac/p/10187)
小S是农场主，他养了 M 只猫，雇了 P 位饲养员。农场中有一条笔直的路，路边有 N 座山，从 1 到 N 编号。第 i 座山与第 i-1 座山之间的距离为 Di，饲养员都住在 1 号山。

有一天，猫出去玩。第 i 只猫去 Hi 号山玩，玩到时刻 Ti 停止，然后在原地等饲养员来接。饲养员们必须回收所有的猫。每个饲养员沿着路从 1 号山走到 N 号山，把各座山上已经在等待的猫全部接走。

饲养员在路上行走需要时间，速度为1 米/单位时间。饲养员在每座山上接猫的时间可以忽略，可以携带的猫的数量为无穷大。

例如有两座相距为 1 的山，一只猫在 2 号山玩，玩到时刻 3 开始等待。如果饲养员从 1 号山在时刻 2 或 3 出发，那么他可以接到猫，猫的等待时间为 0 或 1。而如果他于时刻 1 出发，那么他将于时刻 2 经过 2 号山，不能接到当时仍在玩的猫。

你的任务是规划每个饲养员从 1 号山出发的时间，使得所有猫等待时间的总和尽量小。饲养员出发的时间可以为负。

对于全部的数据，满足 $2\le n\le10^5$，$1\le m\le10^5$，$1\le p\le100$，$1\le D_i<10^4$，$1\le H_i\le n$，$0\le t\le10^9$。

```
斜优好题，与普通斜优不同之处在于多了一个维度，转移顺序不能出错，且a,s的巧妙转移要注意！
```
```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=100005;
long long n,m,p,f[105][N],d[N],hi,ti,a[N],s[N],q[N],h,t;
long long Y(long long x,long long y,int i){return f[i][x]+s[x]-f[i][y]-s[y];} 
int main(){
	scanf("%lld%lld%lld",&n,&m,&p);
	for(int i=2;i<=n;++i) scanf("%lld",&d[i]),d[i]+=d[i-1];
	for(int i=1;i<=m;++i) scanf("%lld%lld",&hi,&ti),a[i]=ti-d[hi];
	sort(a+1,a+1+m);
	for(int i=1;i<=m;++i) s[i]=a[i]+s[i-1],f[0][i]=1e18;
	for(int i=1;i<=p;++i){
		h=t=1,q[1]=0;
		for(int j=1;j<=m;++j){
			while(h<t&&Y(j,q[t],i-1)*(q[t]-q[t-1])<=Y(q[t],q[t-1],i-1)*(j-q[t]))
				--t;
			q[++t]=j;
			while(h<t&&Y(q[h+1],q[h],i-1)<=a[j]*(q[h+1]-q[h]))
				++h;
			f[i][j]=f[i-1][q[h]]+a[j]*(j-q[h])-(s[j]-s[q[h]]);
		}
	}
	printf("%lld",f[p][m]);
	return 0;
}
```
## 斜率优化的进阶应用
将斜率优化与二分/分治/数据结构等结合，来维护性质不那么好（缺少一些单调性性质）的 DP 方程。

### 二分+斜率优化DP（斜率不单调）
#### 例题 [P5785 [SDOI2012]任务安排](https://www.luogu.com.cn/problem/P5785)
这时需要维护凸包上的每一个节点，然后每次用当前的直线去切这个凸包。这个过程可以使用二分解决，因为凸包上相邻两个点的斜率是有单调性的。
```cpp
//|ti|--不满足单调性，维护下凸包二分查找答案 
#include<bits/stdc++.h>
using namespace std;
long long n,s,t[300005],c[300005],f[300005],q[300005],r=1,l;
long long find(long long k){//查找第一个斜率大于k的 
	long ll=0,rr=r;
	while(ll+1<rr){
		long long mi=(ll+rr)>>1;
		if(f[q[mi+1]]-f[q[mi]]<=k*(c[q[mi+1]]-c[q[mi]])) ll=mi;
		else rr=mi;
	}
	return rr;
}
int main(){
	scanf("%lld%lld",&n,&s);
	for(int i=1;i<=n;++i) scanf("%lld%lld",&t[i],&c[i]),t[i]+=t[i-1],c[i]+=c[i-1];
	for(int i=1;i<=n;++i){
		l=find(s+t[i]);
		f[i]=f[q[l]]+t[i]*(c[i]-c[q[l]])+s*(c[n]-c[q[l]]);
		while(1<r&&(f[i]-f[q[r]])*(c[q[r]]-c[q[r-1]])<=(f[q[r]]-f[q[r-1]])*(c[i]-c[q[r]])) --r;
		q[++r]=i;
	}
	cout<<f[n];
	return 0;
}
```
### 二度进阶***
当两个条件不成立时：
1. 直线的斜率不再单调；
2. 每次加入的决策点的横坐标不再单调。

需要进一步维护

方法：（......未完待续）
1. 直接用平衡树维护凸壳，将寻找决策点的二分操作转化为在平衡树上二分
2. CDQ 分治
