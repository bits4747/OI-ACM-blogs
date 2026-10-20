---
public: true
---
#DP 

## 定义
通过一个外层 dp 来计算使得子 dp 最终结果为特定值的方案数，即外层 dp 的状态值为子 dp 的结果值的神奇 dp。

## 例题
### [P4590 [TJOI2018] 游园会](https://www.luogu.com.cn/problem/P4590)
**题意：**

对于每一个 $i$（$i\le K$）求满足如下条件的字符串 $A$ 的数目：

1. 长度为 $N$ 且只出现过 `N`,`O`,`I` 三种字符。
2. 和一个长度为 $K$ 的模式串 $B$ 的**最长公共子序列**长度恰好为 $i$。
3. 不含 `NOI` 这个**子串**。

$N\le1000,K\le15$

**题解：**

我们先忽略限制 3。

回顾求最长上升子序列的过程，定义 $f_{i,j}$ 为 $A$ 的前 $i$ 位，$B$ 的前 $j$ 位的最长上升子序列，则 $f_{i,j}=\max(f_{i-1,j},f_{i,j-1},f_{i-1,j-1}+[A_i=B_j])$。

可以观察到，$f_{i,j}-f_{i,j-1}\le1$，因此可以用 01 串压缩表示 $f_i$。

定义 $dp_{i,f_i}$ 为匹配到 $A$ 的第 $i$ 位时最长上升子序列为 $f_i$ 的方案数，则 $dp_{i,f_i}=\sum_{A_i,f_{i-1}}dp_{i-1,f_{i-1}}$，我们通过枚举 $f_{i-1}$ 和 $A_i$，$O(K)$ 算出 $f_i$，即可转移求出 $dp_{i,f_i}$。

加上限制 3，则在 $dp$ 上多加一维 $l$ 表示当前匹配到 `NOI` 的第几位即可。

复杂度 $O(N*2^K*K)$

```cpp
#include<bits/stdc++.h>
using namespace std;
const int M=1<<15,K=17,P=1e9+7;
char a[K];
int n,k,m,o[M],p,dp[2][M][3],f[K],g[K],ans[K];
int hs(){
	int re=0;
	for(int i=0;i<k;++i) re|=(f[i+1]-f[i])<<i;
	return re;
}
void move(int j,int l,char c,int v){
	for(int i=0;i<k;++i) g[i+1]=(j>>i)&1;
	for(int i=1;i<=k;++i) g[i]+=g[i-1];
	for(int i=1;i<=k;++i) f[i]=max(max(g[i],f[i-1]),g[i-1]+(c==a[i]));
	(dp[p^1][hs()][l]+=v)%=P;
}
int main(){
	scanf("%d%d%s",&n,&k,a+1),m=(1<<k)-1;
	for(int i=1;i<=m;++i) o[i]=o[i>>1]+(i&1);
	dp[0][0][0]=1;
	for(int i=1;i<=n;++i,p^=1){
		for(int j=0;j<=m;++j)for(int r=0;r<3;++r) dp[p^1][j][r]=0;
		for(int j=0;j<=m;++j){
			if(dp[p][j][0]){
				move(j,1,'N',dp[p][j][0]);
				move(j,0,'O',dp[p][j][0]);
				move(j,0,'I',dp[p][j][0]);
			}
			if(dp[p][j][1]){
				move(j,1,'N',dp[p][j][1]);
				move(j,2,'O',dp[p][j][1]);
				move(j,0,'I',dp[p][j][1]);
			}
			if(dp[p][j][2]){
				move(j,1,'N',dp[p][j][2]);
				move(j,0,'O',dp[p][j][2]);
			}
		}
	}
	for(int i=0;i<=m;++i)for(int j=0;j<3;++j) (ans[o[i]]+=dp[p][i][j])%=P;
	for(int i=0;i<=k;++i) printf("%d\n",ans[i]);
	return 0;
}
```
### [P8352 [SDOI/SXOI2022] 小 N 的独立集](https://www.luogu.com.cn/problem/P8352)
**题意：**

给定 $n$ 个点的树的形态以及点的权值范围 $k$，对于任意 $i \in [1,k*n]$， 求有多少种权值分配方案，使得树的最大权独立集大小为 $i$。

$n\le1000,k\le5$

**题解：**

内层 dp 是经典的树形 dp，定义 $dp_{0/1,u}$ 表示是否强制不选 $u$ 时 $u$ 子树的最大独立集。

类似上一题，我们定义 $f_{u,i,j}$ 表示 $u$ 子树内满足 $i=dp_{0,u},j=dp_{1,u}$ 的方案数。

由于 $0\le dp_{0,u}-dp_{1,u}\le k$，可以优化状态设计， $f_{u,i,j}$ 表示 $u$ 子树内满足 $i+j=dp_{0,u},i=dp_{1,u}$ 的方案数，则 $f_{u,i+p+q,\max(0,j-q)}=\sum f_{u,i,j}*f_{v,p,q}$。

树上背包一下即可求出答案。

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=1005,M=5005,P=1e9+7;
int n,k,x,y,sz[N],f[N][M][6],t[M][6],ans[M];
vector<int>e[N];
void dfs(int u,int fa){
	sz[u]=1;
	for(int i=1;i<=k;++i) f[u][0][i]=1;
	for(int v:e[u])if(v!=fa){
		dfs(v,u);
		for(int i=sz[u]*k;~i;--i)for(int j=k;~j;--j) t[i][j]=f[u][i][j],f[u][i][j]=0;
		for(int i=sz[u]*k;~i;--i)for(int j=k;~j;--j)if(t[i][j])
			for(int p=sz[v]*k;~p;--p)for(int q=k;~q;--q)if(f[v][p][q])
				(f[u][i+p+q][max(0,j-q)]+=1ll*t[i][j]*f[v][p][q]%P)%=P;
		sz[u]+=sz[v];
	}
}
int main(){
	scanf("%d%d",&n,&k);
	for(int i=1;i<n;++i) scanf("%d%d",&x,&y),e[x].push_back(y),e[y].push_back(x);
	dfs(1,0);
	for(int i=1;i<=n*k;++i)for(int j=0;(j<=k)&(i+j<=n*k);++j) (ans[i+j]+=f[1][i][j])%=P;
	for(int i=1;i<=n*k;++i) printf("%d\n",ans[i]);
	return 0;
}
```
