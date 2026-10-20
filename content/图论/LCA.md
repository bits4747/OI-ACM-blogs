---
public: true
---
#图论 
## 模板
### 倍增
```cpp
void dfs(int u,int fa){
	d[u]=d[fa]+1,f[0][u]=fa;
	for(int i=1;i<=lg[d[u]];++i) f[i][u]=f[i-1][f[i-1][u]];
	int len=vec[u].size();
	for(int i=0;i<len;++i){
		int v=vec[u][i];
		if(v==fa) continue;
		dfs(v,u);
	}
}
int lca(int u,int v){
	if(d[u]<d[v]) swap(u,v);
	while(d[u]>d[v]) u=f[lg[d[u]-d[v]]][u];
	if(u==v) return u;
	for(int i=lg[d[u]];i>=0;--i)
		if(f[i][u]!=f[i][v]) u=f[i][u],v=f[i][v];
	return f[0][u];
}
int main(){
	for(int i=2;i<=n;++i) lg[i]=lg[i>>1]+1;
	d[0]=-1;
	dfs(1,0);
}
```
### 当然也可以树剖

```cpp
void dfs1(int k){//这是有根树
	dep[k]=dep[f[k]]+1,siz[k]=1;
	int maxx=0;
	for(int v:vec[k]){
		dfs1(v),siz[k]+=siz[v];
		if(siz[v]>maxx) maxx=siz[v],son[k]=v;
	}
}
void dfs2(int k,int tp){
	top[k]=tp;
	if(son[k]) dfs2(son[k],tp);
	for(int v:vec[k])if(v!=son[k]) dfs2(v,v);
}
int lca(int a,int b){
	while(top[a]!=top[b]) (dep[top[a]]>dep[top[b]])?a=f[top[a]]:b=f[top[b]];
	return dep[a]<dep[b]?a:b;
}
```

## 例题
### [#10131. 「一本通 4.4 例 2」暗的连锁](https://loj.ac/p/10131)
树上差分处理出树边被附加边覆盖的次数，即在附加边 $(u,v)$ 的 $u$ 和 $v$ 处 $+1$ ，在 $lca(u,v)$ 处 $-2$ 。

被覆盖 $0$ 次的边贡献 $m$ ，被覆盖 $1$ 次贡献 $1$ ，被覆盖 $2$ 次以上的无贡献。

[code](https://loj.ac/s/1604826)

### [#10132. 「一本通 4.4 例 3」异象石](https://loj.ac/p/10132)
这里求树上连接多个点的最短路径运用了很巧妙的做法：先根据各个异象石结点在树上的时间戳排序（dfs序），求出任意两个相邻结点（包括首尾）之间求最短路径和。由于这个过程相当于围绕着要求的路径走了一圈，最终答案为和的一半。

用set来维护异象石的顺序。

建议观察代码~~学习~~回顾set和指针的用法：[code](https://loj.ac/s/1604799)

### [#10136. 「一本通 4.4 练习 3」聚会](https://loj.ac/p/10136)
求树上到三点距离和最小的点及距离和。

口胡一下可以发现：求出三点任意两点之间的LCA，取最深的LCA。

[code](https://loj.ac/s/1606189)

### 经典老题：[P1852 跳跳棋](https://www.luogu.com.cn/problem/P1852)
记三点为**递增**三元组 $(x,y,z)$ 。
- 扩大边界：中间的元素可以随意往两边跳。
- 缩小边界：到中间距离小的点可以往中间跳。若两边到中间距离相等，则为终止状态。

~~通过天马行空的联想，题解做出了神仙构造：~~

这形似二叉树，往中间跳的是父亲，往两边跳的是儿子。

但由于数据范围是 $|10^9|$ ，直接构造会爆掉。

对于 $(x,y,z)$ ，考虑一直把 $x$ 往中间跳，记 $x,y$ 距离为 $d$ ，则跳一次就变为 $(x+d,y+d,z)$ 。（三元组**递增**， $(x+d,y+d,z)$ 其实就是 $(y,x+2d,z)$ ）

于是可以把往中间跳的这一大段用倍增进行除法加速，过程就是倍增求LCA。

```cpp
#include<bits/stdc++.h>
using namespace std;
struct node{
	int x,y,z;
}a,b,fa,fb;
int s,sa,sb,l,r,ch,ans;
node getf(node t,int p){
	s=0;
	while(p){
		l=t.y-t.x,r=t.z-t.y;
		if(l==r) break;
		if(l<r){
			ch=min(p,(r-1)/l),p-=ch,s+=ch;
			t.x+=l*ch,t.y+=l*ch;
		}
		else{
			ch=min(p,(l-1)/r),p-=ch,s+=ch;
			t.y-=r*ch,t.z-=r*ch;
		}
	}
	return t;
}
int eq(node u,node v){
	return (u.x==v.x&&u.y==v.y&&u.z==v.z);
}
int main(){
	ios::sync_with_stdio(false);
	cin>>a.x>>a.y>>a.z>>b.x>>b.y>>b.z;
	if(a.x>a.y) swap(a.x,a.y);if(a.y>a.z) swap(a.y,a.z);if(a.x>a.y) swap(a.x,a.y);
	if(b.x>b.y) swap(b.x,b.y);if(b.y>b.z) swap(b.y,b.z);if(b.x>b.y) swap(b.x,b.y);
	fa=getf(a,1e9),sa=s;
	fb=getf(b,1e9),sb=s;
	if(!eq(fa,fb)){//如果LCA不同，无法跳到
		cout<<"NO";
		return 0;
	}//以下过程和普通倍增求LCA极度相似
	if(sa<sb) swap(sa,sb),swap(a,b);
	a=getf(a,sa-sb);//把两者移到同一高度
	if(eq(a,b)){
		cout<<"YES\n"<<sa-sb;
		return 0;
	}
	for(int i=log2(sb);i>=0;--i){//一起向上移
		fa=getf(a,(1<<i)),fb=getf(b,(1<<i));
		if(!eq(fa,fb)) a=fa,b=fb,ans+=(1<<i);
	}
	cout<<"YES\n"<<ans*2+2+sa-sb;
	return 0;
}
```
