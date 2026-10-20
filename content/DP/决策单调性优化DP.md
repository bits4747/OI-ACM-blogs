---
public: true
---
#DP 
## 一维 DP
### 定义
形如 $dp_i​=\min/\max(dp_j​+f(j,i))$ 的式子，令 $p_i$​ 为 $i$ 的最优决策，若 $p_i$​ 具有单调性，则这个 dp 式子就满足决策单调性。

### 判断

令 $f_j​(i)$ 为用 $j$ 转移时 $dp_i$​ 的值，即 $dp_j​+f(j,i)$。

若对于任意 $j_1​<j_2​$，$f_{j_1}​​(i)$ 和 $f_{j_2}​​(i)$ 的函数图像至多有一个交点，在这个交点之前是 $f_{j_1}​​(i)$ 更优，在这个交点后 $f_{j_2}​​(i)$ 更优，那么这个问题就满足决策单调性。

纯代数方法：[证明](https://www.luogu.com.cn/blog/_post/217270)~~（反正我不太会，感觉好麻烦）~~

数形结合法：[详解](https://www.luogu.com.cn/blog/flashblog/solution-p1912)
![[Pasted image 20230913214615.png]]

感性理解法：

只需证明若 $i$ 的最优决策为 $j$，$i+1$ 的最优决策不为 $j-1$，再推广一下，$i+p$ 的最优决策不为 $j-q$ 即可。

## 代码实现
### 单调队列
#### [P1912 [NOI2009] 诗人小G](https://www.luogu.com.cn/problem/P1912)
![[Pasted image 20230913214914.png]]

决策函数 $f_j(i)$ 关于直线 $x=s_j​+1+L$ 对称，且导函数递增（$P=1$ 时不变），符合决策单调性。

求函数交点（决策改变点）可以 $O(1)$ 解方程，复杂度可以降一个 $\log$。（但我是二分求解，没有充分发挥单调队列的优势）

```cpp
#include<bits/stdc++.h>
using namespace std;
#define ld long double
const int N=1e5+5;
int T,n,len,p,a[N],fr[N],h,t;
ld f[N];
struct node{int l,r,x;}q[N];
char s[N][35];
ld poww(ld a,int k){ld e=1;while(k){if(k&1)e=e*a;a=a*a,k>>=1;}return e;}
ld calc(int i,int j){return f[j]+poww(abs(a[i]-a[j]-len),p);}
void bound(int i){
	int ll=max(i+1,q[t].l)-1,rr=q[t].r+1,mi;
	while(ll+1<rr){
		mi=(ll+rr)>>1;
		if(calc(mi,i)<=calc(mi,q[t].x)) rr=mi;
		else ll=mi;
	}
	if(rr<=max(i+1,q[t].l)) --t;
	else q[t].r=rr-1;
	if(rr<=n) q[++t]=(node){rr,n,i};
}
void output(int x){
	if(fr[x]) output(fr[x]);
	printf("%s",s[fr[x]+1]);
	for(int i=fr[x]+2;i<=x;++i) printf(" %s",s[i]);
	printf("\n");
}
int main(){
	scanf("%d",&T);
	while(T--){
		scanf("%d%d%d",&n,&len,&p),++len;
		for(int i=1;i<=n;++i) scanf("%s",s[i]),a[i]=a[i-1]+strlen(s[i])+1;
		h=t=1,q[1]=(node){1,n,0};
		for(int i=1;i<=n;++i){
			while(h<t&&q[h].r<i) ++h;
			f[i]=calc(i,q[h].x),fr[i]=q[h].x;
			while(h<=t&&calc(q[t].l,q[t].x)>=calc(q[t].l,i)) --t;
			if(h<=t) bound(i);
			else if(i<n)q[++t]=(node){i+1,n,i};
		}
		if(f[n]>1e18) printf("Too hard to arrange\n");
		else{
			printf("%lld\n",(long long)(f[n]+0.5));
			output(n);
		}
		printf("--------------------\n");
	}
	return 0;
}
```
### 分治
#### [P3515 [POI2011] Lightning Conductor](https://www.luogu.com.cn/problem/P3515)
![[Pasted image 20230913213730.png]]

$f_j(i)=a_j+\sqrt{i-j}$，此函数的导函数递减，所有 $j$ 的函数可通过平移转换，最多有一个交点，符合决策单调性。

假设已知 $[l,r]$ 的最优决策在 $[sl,sr]$ 上。

定义 $mid=\frac{l+r}2$​，设 $dp_mid$ 的最优决策为 $p$，根据决策单调性，可知 $[l,mid−1]$ 的最优决策在 $[sl,p]$ 内，$[mid+1,r]$ 的最优决策在 $[p,sr]$ 内。

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=5e5+5;
int n,a[N];
double sq[N],f[N];
void solve(int l,int r,int sl,int sr){
	if(l>r) return ;
	int mi=(l+r)>>1,pos;double maxx=0;
	for(int i=sl;i<=min(mi,sr);++i)
		if(maxx<a[i]+sq[mi-i]) maxx=a[i]+sq[mi-i],pos=i;
	f[mi]=max(f[mi],maxx);
	solve(l,mi-1,sl,pos),solve(mi+1,r,pos,sr);
}
int main(){
	scanf("%d",&n);
	for(int i=1;i<=n;++i) scanf("%d",&a[i]),sq[i]=sqrt(i);
	solve(1,n,1,n);
	reverse(a+1,a+1+n),reverse(f+1,f+1+n);
	solve(1,n,1,n);
	for(int i=n;i>=1;--i) printf("%lld\n",(long long)(ceil(f[i])-a[i]));
	return 0;
}
```
#### [P5574 [CmdOI2019] 任务分配问题](https://www.luogu.com.cn/problem/P5574)
**题意：** 给一个序列分成 $k$ 段，让每段内顺序对总和最小。

**题解：**

定义 $f_{k,i}$ 表示前 $i$ 个任务用了 $k$ 个 CPU，第 $k$ 个 CPU 在 $i$ 时的最小顺序对数，则 $f_{k,i}​=\min(f_{k-1,j}+w(j,i))$。（$w(j,i)$ 表示 $[j+1,i]$ 中顺序对个数）

观察到，如果 $i$ 的最优策略为 $j$，那么 $i+1$ 的最优策略不可能为 $j-1$。（因为 $f_j\ge f_{j-1}$，所以 $w(j,i)\le w(j-1,i)$，所以 $w(j,i+1)\le w(j-1,i+1)$）此结论可推广到 $i+p,j-q$，因此有决策单调性。

区间顺序对数可以在分治时通过类似莫队的方法维护树状数组求出来。因为每一层要往树状数组内插入、删除 $n$ 次，总共 $\log n$ 层，复杂度为 $k*n\log^2n$。

[code](https://www.luogu.com.cn/record/124657419)
### 区别
通常情况下，单调队列比分治少个 $\log$，但分治胜在好写易懂不易错，时间复杂度卡得不死时建议分治。

不过，有些特殊的题因转移函数需连续求解，只能用分治写法，如：[P5574 [CmdOI2019] 任务分配问题](https://www.luogu.com.cn/problem/P5574)。

## 双指针优化
### [P1973 [NOI2011] NOI 嘉年华](https://www.luogu.com.cn/problem/P1973)
![[Pasted image 20230914074653.png]]

**题解：**

先离散化时间，再处理出 $c_{i,j}$ 表示时间 $[i,j]$ 内有机场活动。

定义 $f_{i,j}$ 表示在时间区间 $[1,i]$，一个会场至少举办 $j$ 个活动的情况下，另一个会场最多举办多少个活动，则 $f_{i,j​}=\max\{f_{k,j​}​+c_{k,i}​,f{k,j}−c_{k,i}\}$。复杂度 $O(n^3)$。

对于第二问，我们反着求一边，记为 $g$。

定义 $s_{L,R}$ ​为一边强制选 $[L,R]$ 之间所有活动时的最优解，则$s_{L,R}=\max_{L,R,x,y} \min(x+c_{l,r}+y,f_{L,x}+g_{R,y})$。复杂度 $O(n^4)$。

由于 $x,y$ 有各种限制，肯定跑不满，其实可以过。

[code](https://www.luogu.com.cn/record/94997218)

枚举 $x$ 时最优解方案为 $y$，那么当 $x$ 增大时，最优解 $y$ 不递增。因此，只需把 $y$ 从大往小扫一次即可。复杂度降为 $O(n^3)$。

但是我们发现被 HACK 了：[Unaccepted 99](https://www.luogu.com.cn/record/124646497)

[详见](https://rsdbk-husky.blog.luogu.org/luogu-p1973-noi2011-noi-jia-nian-hua)[](https://rsdbkhusky.github.io/2021/10/13/%E5%8F%8C%E6%8C%87%E9%92%88%E4%BC%98%E5%8C%96dp%20&%20Luogu%20P1973%20%5BNOI2011%5D%20NOI%20%E5%98%89%E5%B9%B4%E5%8D%8E/)

![[Pasted image 20230914084036.png]]

[code](https://www.luogu.com.cn/record/124647251)

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=205,M=405;
int n,l[N],r[N],a[M],m,c[M][M],f[M][N],g[M][N],ans,q,s[M][M];
#define F(x) min(c[i][j]+p+(x),f[i-1][p]+g[j+1][(x)])
int main(){
	scanf("%d",&n);
	for(int i=1;i<=n;++i) scanf("%d%d",&l[i],&r[i]),r[i]+=l[i]-1,a[i]=l[i],a[i+n]=r[i];
	sort(a+1,a+1+n+n),m=unique(a+1,a+1+n+n)-(a+1);
	for(int i=1;i<=n;++i) l[i]=lower_bound(a+1,a+1+m,l[i])-a,r[i]=lower_bound(a+1,a+1+m,r[i])-a;
	for(int i=1;i<=m;++i)for(int j=i;j<=m;++j)for(int k=1;k<=n;++k)if(i<=l[k]&&r[k]<=j) ++c[i][j];
	memset(f,128,sizeof(f)),f[0][0]=0;
	for(int i=1;i<=m;++i)for(int j=0;j<=c[1][i];++j){
		for(int k=i;k&&c[k][i]<=j;--k) f[i][j]=max(f[i][j],f[k-1][j-c[k][i]]);
		for(int k=i;k&&j+c[k][i]<=c[1][i];--k) f[i][j]=max(f[i][j],f[k-1][j]+c[k][i]);
		ans=max(ans,min(f[i][j],j));
	}
	for(int i=1;i<=m;++i)for(int j=n-1;~j;--j) f[i][j]=max(f[i][j],f[i][j+1]);
	printf("%d\n",ans);
	memset(g,128,sizeof(g)),g[m+1][0]=0;
	for(int i=m;i;--i)for(int j=0;j<=c[i][m];++j){
		for(int k=i;k<=m&&c[i][k]<=j;++k) g[i][j]=max(g[i][j],g[k+1][j-c[i][k]]);
		for(int k=i;k<=m&&j+c[i][k]<=c[i][m];++k) g[i][j]=max(g[i][j],g[k+1][j]+c[i][k]);
	}
	for(int i=1;i<=m;++i)for(int j=n-1;~j;--j) g[i][j]=max(g[i][j],g[i][j+1]);
	memset(s,128,sizeof(s));
	for(int i=1;i<=m;++i)for(int j=i;j<=m;++j){
		q=c[j+1][m];
		for(int p=0;p<=c[1][i-1];++p){
			while(q&&F(q)<=F(q-1)) --q;
			s[i][j]=max(s[i][j],F(q));
		}
	}
	for(int i=1;i<=n;++i){
		ans=0;
		for(int j=1;j<=l[i];++j)for(int k=r[i];k<=m;++k) ans=max(ans,s[j][k]);
		printf("%d\n",ans);
	}
	return 0;
}
```
### [P3724 [AHOI2017/HNOI2017] 大佬](https://www.luogu.com.cn/problem/P3724)
**题意：**

![[Pasted image 20230914160641.png]]
![[Pasted image 20230914161108.png]]

**题解：**

可以发现自保和反击相独立，可以用简单的 dp 预处理保证出 $n$ 天不死可以用来反击的最大天数。

通过 BFS 暴力求出花费 $i$ 天可造成的嘲讽值，用 map 去重、剪枝，记录嘲讽值和天数的二元组 $s$，大概有 $1e7$ 左右。

怼一次和不怼只还嘴的情况很容易判断，考虑怎么快速判断怼两次的情况。

![[Pasted image 20230914161410.png]]

即 $f2-d2\ge C-f1+d1-D$。

我们把二元组 $s$ 排序，双指针维护，$f1$ 从大到小枚举，$f2$ 从小到大，记录 $f2-d2$ 的前缀最大值进行判断。

```cpp
#include<bits/stdc++.h>
using namespace std;
#define pa pair<int,int>
#define fi first
#define se second
const int N=105,M=1e7;
int n,m,mc,a[N],w[N],d[N][N],D,t,c[25],C,p,mx;
pair<int,int>v,s[M];
map<pa,int>mp;
struct qwq{int l,f,d;}u;
queue<qwq>q;
int work(int k){
	p=1,mx=-1e9;
	if(D>=c[k]) return 1;
	for(int i=1;i<=t;++i)if(s[i].fi<=c[k]&&s[i].fi+D-s[i].se>=c[k]) return 1;
	for(int i=t;i;--i)if(s[i].fi<=c[k]){
		while(p<t&&s[i].fi+s[p].fi<=c[k]) mx=max(s[p].fi-s[p].se,mx),++p;
		if(mx>=c[k]-s[i].fi+s[i].se-D) return 1;
	}
	return 0;
}
int main(){
	scanf("%d%d%d",&n,&m,&mc);
	for(int i=1;i<=n;++i) scanf("%d",&a[i]);
	for(int i=1;i<=n;++i) scanf("%d",&w[i]);
	for(int i=1;i<=m;++i) scanf("%d",&c[i]),C=max(C,c[i]);
	for(int i=1;i<=n;++i)for(int j=a[i];j<=mc;++j)
		d[i][j-a[i]]=max(d[i][j-a[i]],d[i-1][j]+1),
		d[i][min(mc,j-a[i]+w[i])]=max(d[i][min(mc,j-a[i]+w[i])],d[i-1][j]);
	for(int i=1;i<=n;++i)for(int j=0;j<=mc;++j) D=max(D,d[i][j]);
	if(D) q.push((qwq){0,1,1});
	while(!q.empty()){
		u=q.front(),q.pop();
		if(u.d==D) continue;
		q.push((qwq){u.l+1,u.f,u.d+1});
		if(u.l>1&&1ll*u.l*u.f<=C){
			v.fi=u.l*u.f,v.se=u.d+1;
			if(!mp[v]) q.push((qwq){u.l,u.l*u.f,u.d+1}),mp[v]=1,s[++t]=v;
		}
	}
	sort(s+1,s+1+t);
	for(int i=1;i<=m;++i) printf("%d\n",work(i));
	return 0;
}
```
