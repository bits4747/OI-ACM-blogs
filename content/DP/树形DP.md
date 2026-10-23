---
public: true
---
#DP 

问题定义在树形结构上，依照子树设定子问题。

常常用$F_{u,s}$表示子树$u$在状态限制$s$下的最优解。 

先递归求解子树的答案，再计算当前结点答案。
## 普通树形DP
### 例题
[P1122 最大子树和](https://www.luogu.com.cn/problem/P1122)   
[P1352	没有上司的舞会](https://www.luogu.com.cn/problem/P1352)  
[P4084 [USACO17DEC]Barn Painting G](https://www.luogu.com.cn/problem/P4084)   
[P2016 战略游戏](https://www.luogu.com.cn/problem/P2016)  
[P2458 [SDOI2006]保安站岗](https://www.luogu.com.cn/problem/P2458)  
[P3621 [APIO2007]风铃](https://www.luogu.com.cn/problem/P3621)  
[P4099	[HEOI2013]SAO](https://www.luogu.com.cn/problem/P4099)  
[P3174 [HAOI2009]毛毛虫](https://www.luogu.com.cn/problem/P3174)  
[P3237	[HNOI2014]米特运输](https://www.luogu.com.cn/problem/P3237)

## 树上背包
就是各种背包在树上的应用，难点实际上还在于背包本身。

此外，树上背包通过 **上下界优化** 复杂度可以达到 $n*m$，转移过程要用 **填表法**（我为人人）而非查表法（人人为我）。

注意背包的转移顺序，每次开一个临时数组存储这次转移前的 dp 值可以减少不必要的麻烦。
### 例题
#### [P4516 [JSOI2018] 潜入行动](https://www.luogu.com.cn/problem/P4516)
定义 $f_{i,j,0/1,0/1}$ 表示子树 $i$ 内放了 $j$ 个且 $i$ 是否放，$i$ 的儿子是否放（即 $i$ 是否被监视）的方案数。（子树内其他点都被监视）
```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=1e5+5,M=105,p=1e9+7;
int n,m,x,y,sz[N],f[N][M][2][2],t[M][2][2];
vector<int>vec[N];
int A(int a,int b){return a+b>=p?a+b-p:a+b;}
void dfs(int u,int fa){
	sz[u]=f[u][0][0][0]=f[u][1][1][0]=1;
	for(int v:vec[u]){
		if(v==fa) continue;
		dfs(v,u);
		int mj=min(sz[u],m),mk=min(sz[v],m);
		for(int j=0;j<=mj;++j){
			t[j][0][0]=f[u][j][0][0],t[j][0][1]=f[u][j][0][1],
			t[j][1][0]=f[u][j][1][0],t[j][1][1]=f[u][j][1][1];
			f[u][j][0][0]=f[u][j][0][1]=f[u][j][1][0]=f[u][j][1][1]=0;
		}
		for(int j=0;j<=mj;++j)for(int k=0;k<=mk&&j+k<=m;++k){
			f[u][j+k][0][0]=A(f[u][j+k][0][0],1ll*t[j][0][0]*f[v][k][0][1]%p);
			f[u][j+k][0][1]=A(A(f[u][j+k][0][1],1ll*t[j][0][1]*
							A(f[v][k][0][1],f[v][k][1][1])%p),1ll*t[j][0][0]*f[v][k][1][1]%p);
			f[u][j+k][1][0]=A(f[u][j+k][1][0],1ll*t[j][1][0]*A(f[v][k][0][0],f[v][k][0][1])%p);
			f[u][j+k][1][1]=A(A(f[u][j+k][1][1],1ll*t[j][1][1]*A(A(A(f[v][k][0][0],f[v][k][0][1]),
				f[v][k][1][0]),f[v][k][1][1])%p),1ll*t[j][1][0]*A(f[v][k][1][0],f[v][k][1][1])%p);
		}
		sz[u]+=sz[v];
	}
}
int main(){
	scanf("%d%d",&n,&m);
	for(int i=1;i<n;++i) scanf("%d%d",&x,&y),vec[x].push_back(y),vec[y].push_back(x);
	dfs(1,0);
	printf("%d",A(f[1][m][0][1],f[1][m][1][1]));
	return 0;
}
```
#### [CF512D Fox And Travelling](https://www.luogu.com.cn/problem/CF512D)
首先，在一个环里的肯定不能选，把环去掉后剩下由若干有根、无根树组成的森林（有根指根与环相连，必须最后选）。

对于有根树，必须从叶子结点开始从下往上选。定义 $f_{i,j}$ 表示 $i$ 子树选 $j$ 个的方案数，对于每个点 $i$，先背包+组合处理 $siz_i-1$ 个点的选择方案（选择有顺序之分），最后 $f_{i,siz_i}=f_{i,siz_{i-1}}$（$i$ 只有在其他点都选的情况下才能选）。

对于无根树，可以把每个点当作根处理一次，再去重，$g_{i,j}/=siz_i-j$。其中 $g_{i,j}$ 表示第 $i$ 棵树选 $j$ 个点的方案数，除以 $siz_i-j$ 是因为除了以被选的 $j$ 个点为根时都计算了一次答案。

处理完后对每个树根再来个背包。
```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=105,p=1e9+9;
int n,m,x,y,d[N],b[N],co[N],sz[N],c[N][N],f[N][N],tp,cnt,ssz[N],id[N],g[N][N],siz,dp[N],inv[N];
vector<int>e[N];
queue<int>q;
void dfs(int u,int fa,int ty){
	for(int i=1;i<=n;++i) f[u][i]=0;
	co[u]=ty,sz[u]=f[u][0]=1;
	for(int v:e[u]){
		if(v==fa||b[v]==-1) continue;
		dfs(v,u,ty);
		for(int i=sz[u]-1;~i;--i)
			for(int j=1;j<=sz[v];++j)
				f[u][i+j]=(f[u][i+j]+1ll*f[u][i]*f[v][j]%p*c[i+j][j]%p)%p;
		sz[u]+=sz[v];//i+j个位置中选j个位v子树内选的
	}
	f[u][sz[u]]=f[u][sz[u]-1];
	if(!fa) for(int i=0;i<=sz[u];++i) g[ty][i]=(g[ty][i]+f[u][i])%p;
}
int main(){
	scanf("%d%d",&n,&m);
	for(int i=0;i<=n;++i) c[i][0]=1;
	for(int i=1;i<=n;++i)for(int j=1;j<=i;++j) c[i][j]=(c[i-1][j-1]+c[i-1][j])%p;
	inv[0]=inv[1]=1;
	for(int i=2;i<=n;++i) inv[i]=1ll*(p-p/i)*inv[p%i]%p;
	for(int i=1;i<=n;++i) b[i]=-1;
	for(int i=1;i<=m;++i)
		scanf("%d%d",&x,&y),e[x].push_back(y),e[y].push_back(x),++d[x],++d[y];
	for(int i=1;i<=n;++i)if(d[i]<=1) q.push(i),b[i]=0;
	while(!q.empty()){
		x=q.front(),q.pop();
		for(int v:e[x])if(--d[v]<=1&&b[v]==-1) q.push(v),b[v]=0;
	}
	for(int i=1;i<=n;++i){
		if(b[i]==-1) continue;
		for(int v:e[i])if(b[v]==-1) b[i]=1;
	}
	for(int i=1;i<=n;++i)if(b[i]==1) dfs(i,0,++cnt),id[cnt]=i,ssz[cnt]=sz[i];
	tp=cnt;
	for(int i=1;i<=n;++i){
		if(b[i]!=0||(co[i]&&co[i]<=tp)) continue;
		if(!co[i]) co[i]=++cnt,id[cnt]=i;
		dfs(i,0,co[i]),ssz[co[i]]=sz[i];
	}
	dp[0]=1;
	for(int i=1;i<=cnt;++i){
		if(b[id[i]]!=1)
			for(int j=0;j<=ssz[i];++j) g[i][j]=1ll*g[i][j]*inv[ssz[i]-j]%p;
		for(int j=siz;~j;--j)for(int k=1;k<=ssz[i];++k)
			dp[j+k]=(dp[j+k]+1ll*dp[j]*g[i][k]%p*c[j+k][k])%p;
		siz+=ssz[i];
	}
	printf("1\n");
	for(int i=1;i<=n;++i) printf("%d\n",dp[i]);
	return 0;
}
```
#### [Hdu-6769 In Search of Gold](http://acm.hdu.edu.cn/showproblem.php?pid=6769)
**题意：**  给一棵 $N$ 个点的树，每条边有 $A_i,B_i$ 权值可以选，问选 $K$ 条边作为 $A$ 边，其余 $N-1-K$ 条边为 $B$ 边，求最短直径。

**题解：** 二分直径，定义 $f_{i,j}$ 表示 $i$ 子树内选 $j$ 条 A 边且子树内直径不超过 $mid$ 时最长链的最短长度。

当初死活不肯写刷表法，导致转移又臭又长又慢（其实复杂度应该没假，就是卡上下界很麻烦）。

丑陋的code

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=20005;
int read(){
    int x=0,f=1;char c=getchar();
    while(c<'0'||c>'9'){if(c=='-') f=-1;c=getchar();}
    while(c>='0'&&c<='9') x=x*10+c-'0',c=getchar();
    return x*f;
}
#define ll long long
int T,n,k,x,y,sz[N];
ll l,r,m,t[25],f[N][25];
struct edge{int v,a,b;}tmp;
vector<edge>vec[N];
void dfs(int u,int fa){
    sz[u]=1;
    for(edge i:vec[u]){
        if(i.v==fa) continue;
        dfs(i.v,u),sz[u]+=sz[i.v];
        for(int j=0;j<=k;++j) t[j]=f[u][j],f[u][j]=m+1;
        for(int j=min(k,sz[u]-1);~j;--j)
            for(int o=max(0,j-(sz[u]-sz[i.v]-1)-1);o<=min(j,sz[i.v]-1);++o){
                if(j-o<=sz[u]-sz[i.v]-1&&f[i.v][o]+i.b+t[j-o]<=m)
                    f[u][j]=min(f[u][j],max(f[i.v][o]+i.b,t[j-o]));
                if(j>o&&f[i.v][o]+i.a+t[j-o-1]<=m)
                    f[u][j]=min(f[u][j],max(f[i.v][o]+i.a,t[j-o-1]));
            }
    }
    if(sz[u]==1) f[u][0]=0;
}
int check(){
    for(int i=1;i<=n;++i)for(int j=0;j<=k;++j) f[i][j]=0;
    dfs(1,0);
    return f[1][k]<=m;
}
void solve(){
    n=read(),k=read(),l=0,r=0;
    for(int i=1;i<=n;++i) vector<edge>().swap(vec[i]);
    for(int i=1;i<n;++i){
        x=read(),tmp.v=read(),tmp.a=read(),tmp.b=read(),r+=max(tmp.a,tmp.b);
        vec[x].push_back(tmp),swap(x,tmp.v),vec[x].push_back(tmp);
    }
    while(l+1<r){
        m=(l+r)>>1;
        if(check()) r=m;
        else l=m;
    }
    printf("%lld\n",r);
}
int main(){
    T=read();
    while(T--) solve();
    return 0;
}
```

## 树形依赖背包

^19a1ed

要选取一个结点上的物品，需要选取其父结点的物品。

- 朴素写法：枚举子树分配体积（01背包用点对数量分析）
- 2009年国家集训队论文 徐持衡《浅谈几类背包题》
- 借助DFS序拍平成线性结构

** DFS序为$i$的点子树大小为$S_i$，体积为$W_i$,价值为$V_i$,$F_{i,j}=\max\{F_{i+S_i,j},F_{i+1,j-W_i}+V_i\}$ (i从大到小倒序枚举)**

### 例题
[P1273 有线电视网](https://www.luogu.com.cn/problem/P1273)   
[P2014	[CTSC1997]选课](https://www.luogu.com.cn/problem/P2014)   
[P2015 二叉苹果树](https://www.luogu.com.cn/problem/P2015)   
[P3177 [HAOI2015]树上染色](https://www.luogu.com.cn/problem/P3177)  
[P3354 [IOI2005]Riv 河流](https://www.luogu.com.cn/problem/P3354)  
[P1270 “访问”美术馆](https://www.luogu.com.cn/problem/P1270)  
[P4322 [JSOI2016]最佳团体](https://www.luogu.com.cn/problem/P4322)  
[P1272 重建道路](https://www.luogu.com.cn/problem/P1272)  
[P4037 [JSOI2008]魔兽地图](https://www.luogu.com.cn/problem/P4037)  

## 换根dp

- 先以1为根结点，求出$F_u$表示$u$子树的最优解
- 考虑将根结点换到1的邻点2上，只有1和2两个结点的相对关系发生变化，快速地计算出新的$F_1$和$F_2$
- 继续换根直到尝试过以每个点为根结点
- 回溯操作就是递归操作的逆  

### 例题
[P3478 [POI2008]STA-Station](https://www.luogu.com.cn/problem/P3478)  
[P2986 [USACO10MAR]Great Cow Gathering G](https://www.luogu.com.cn/problem/P2986)  
[P3047	[USACO12FEB]Nearby Cows G](https://www.luogu.com.cn/problem/P3047)  
[P6419 [COCI2014-2015#1] Kamp](https://www.luogu.com.cn/problem/P6419)  
[P3647 [APIO2014]连珠线](https://www.luogu.com.cn/problem/P3647)
## 基环树DP
### 例题
[P1453 城市环路](https://www.luogu.com.cn/problem/P1453)    
[P2607 [ZJOI2008]骑士](https://www.luogu.com.cn/problem/P2607)  
