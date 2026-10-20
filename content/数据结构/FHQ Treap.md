---
public: true
---
#数据结构 #平衡树
## 简介
### Treap
> Treap 是一种 **弱平衡** 的 **二叉搜索树**，它同时符合二叉搜索树和堆的性质。
> 
> 其中，二叉搜索树的性质是：
> 
> -   左子节点的值（$\textit{val}$）比父节点小
> -   右子节点的值（$\textit{val}$）比父节点大
> 
> 堆的性质是：
> 
> -   子节点值（$\textit{priority}$）比父节点大（小根堆）

> Treap 在搜索树的基础上，引入一个给堆的值 $\textit{priority}$。对于 $\textit{val}$ 值，我们维护搜索树的性质，对于 $\textit{priority}$ 值，我们维护堆的性质。其中 $\textit{priority}$ 这个值是随机给出的。

> Treap 通过随机化 $\textit{priority}$ 值让搜索树 **期望** 保持在 $\log_2{n}$，极大程度上避免了退化成链的问题。

Treap 本质上属于[[笛卡尔树]]。

### FHQ Treap
FHQ Treap 通过 **分裂** 与 **合并** 两个核心操作基本上能支持平衡树的所有操作。
## 基本操作
### 合并
合并 $k1,k2$ 两棵树（其中 $k1$ 的值/排名小于 $k2$）。
```cpp
int merge(int k1,int k2){
	if(!k1||!k2) return k1+k2;
	//保证子节点priority值比父节点大
	if(s[k1].p<s[k2].p) return s[k1].rs=merge(s[k1].rs,k2),pu(k1),k1;
	else return s[k2].ls=merge(k1,s[k2].ls),pu(k2),k2;
}
```
### 分裂
把 $k$ 分裂为两棵树 $k1,k2$，其中 $k1$ 的值/排名小于 $k2$。
```cpp
void split(int k,int val,int &k1,int &k2){//按val分裂
	if(!k){k1=k2=0;return ;}
	if(s[k].v<=val) k1=k,split(s[k].rs,val,s[k].rs,k2),pu(k1);
	else k2=k,split(s[k].ls,val,k1,s[k].ls),pu(k2);
}
```
```cpp
void split(int k,int x,int &k1,int &k2){//按排名分裂
	if(!k){k1=k2=0;return ;}
	if(s[s[k].ls].sz+s[k].len>x) k2=k,split(s[k].ls,x,k1,s[k].ls),pu(k);
	//k排名在x后
	else k1=k,split(s[k].rs,x-s[s[k].ls].sz-s[k].len,s[k].rs,k2),pu(k);
	//k不在x后
}
```
**注意：分裂后相当于变成了两棵树，后一棵树的 $siz$ 要加上前一棵树的才是原来的 $siz$。**

例如分出第 $x$ 个数要：

```cpp
split(u,x-1,t1,t2),split(t2,1,t0,t2);//第x个数在t0
//错误写法：split(u,x-1,t1,t2),split(t2,x,t0,t2);
```
分区间 $[x,y]$ 要：

```cpp
split(u,x-1,t1,t0),split(t0,y-x+1,t0,t2);
//错误写法：split(u,x-1,t1,t0),split(t0,y,t0,t2);
```
当然，为了避免麻烦可以从后往前分。
### 查询排名为k的数
当然，如果平衡树本身就维护排名可以直接 $split$。
```cpp
int find(int k,int x){
	if(s[s[k].ls].siz+1==x) return s[k].v;
	if(s[s[k].ls].siz>=x) return find(s[k].ls,x);
	return find(s[k].rs,x-s[s[k].ls].siz-1);
}
```
#### [P3369 【模板】普通平衡树](https://www.luogu.com.cn/problem/P3369)

平衡树维护值。

通过合并分裂可以轻松完成很多操作，如：
1. 插入 $x$ 数
2. 删除 $x$ 数(若有多个相同的数，应只删除一个)
3.  查询 $x$ 数的排名(排名定义为比当前数小的数的个数 $+1$ )：分裂一下
4.  查询排名为 $x$ 的数
5.  求 $x$ 的前驱(前驱定义为小于 $x$，且最大的数)：分裂+op4
6. 求 $x$ 的后继(后继定义为大于 $x$，且最小的数)：分裂+op4

[code](https://www.luogu.com.cn/record/102705454)

#### [P5338 [TJOI2019]甲苯先生的滚榜](https://www.luogu.com.cn/problem/P5338)

平衡树维护值。$AC$ 数+罚时重新定义值的大小比较即可。

[code](https://www.luogu.com.cn/record/102729995)
#### [P3850 [TJOI2007]书架](https://www.luogu.com.cn/problem/P3850)

平衡树维排名。

[code](https://www.luogu.com.cn/record/102751264)  
#### ★[P3285 [SCOI2014]方伯伯的OJ](https://www.luogu.com.cn/problem/P3285) 
平衡树维排名。

1. 巧妙变段为点

   由于 $n$ 高达 $1e8$，但操作数 $1e5$，可以每个点维护 $l,r,len$，表示此点存储 $l\sim r$ 长 $len$ 的编号，当需要操作这一段里的某个数时再裂开。
2. 利用 $map$ 映射编号和树上节点号

   在编号 $l$ 处存贮节点号，每次 --upper_bound，找到编号所在的节点号。

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=3e5+5;
map<int,int>mp;
map<int,int>::iterator it;
int n,m,u,t,t0,t1,t2,cnt,la,ty,x,y,re;
struct node{int fa,ls,rs,l,r,len,sz,p;}s[N];
void pu(int k){
	s[k].sz=s[s[k].ls].sz+s[s[k].rs].sz+s[k].len;
	s[s[k].ls].fa=s[s[k].rs].fa=k;
}
int merge(int k1,int k2){
	if(!k1||!k2) return k1+k2;
	if(s[k1].p<s[k2].p) return s[k1].rs=merge(s[k1].rs,k2),pu(k1),k1;
	else return s[k2].ls=merge(k1,s[k2].ls),pu(k2),k2;
}
void split(int k,int x,int &k1,int &k2){
	if(!k){k1=k2=0;return ;}
	if(s[s[k].ls].sz+s[k].len>x) k2=k,split(s[k].ls,x,k1,s[k].ls),pu(k);
	else k1=k,split(s[k].rs,x-s[s[k].ls].sz-s[k].len,s[k].rs,k2),pu(k);
}
void add(int l,int r,int pos){
	s[++cnt]=(node){0,0,0,l,r,r-l+1,r-l+1,rand()},mp[l]=cnt;
	split(u,pos,t1,t2),u=merge(merge(t1,cnt),t2);
}
void del(int re,int x){
	split(u,re,t1,t2),split(t2,re+s[x].len-s[t1].sz,t2,t0),u=merge(t1,t0);
}
void ask(int x){
	re=s[s[x].ls].sz;
	while(s[x].fa){
		if(x==s[s[x].fa].rs) re+=s[s[x].fa].len+s[s[s[x].fa].ls].sz;
		x=s[x].fa;
	}
}
int ran(int k,int x){
	if(s[s[k].ls].sz>=x) return ran(s[k].ls,x);
	if(s[s[k].ls].sz+s[k].len>=x) return s[k].l+x-s[s[k].ls].sz-1;
	return ran(s[k].rs,x-s[s[k].ls].sz-s[k].len);
}
int main(){
	scanf("%d%d",&n,&m);
	srand(time(NULL)),add(1,n,0);
	for(int i=1;i<=m;++i){
		scanf("%d%d",&ty,&x),x-=la;
		if(ty==4){printf("%d\n",la=ran(u,x));continue;}
		it=--mp.upper_bound(x),t=(*it).second,mp.erase(it);
		ask(t),del(re,t);
		if(x>s[t].l) add(s[t].l,x-1,re);
		if(x<s[t].r) add(x+1,s[t].r,re+x-s[t].l);
		if(ty==1){
			scanf("%d",&y),y-=la;
			printf("%d\n",la=(re+x-s[t].l+1)),add(y,y,re+x-s[t].l);
		}
		if(ty==2) printf("%d\n",la=(re+x-s[t].l+1)),add(x,x,0);
		if(ty==3) printf("%d\n",la=(re+x-s[t].l+1)),add(x,x,n-1);
	}
	return 0;
}
```
### 建树
直接 $n\log n$ 插入太慢，如需加入一段点，可以先类似[[笛卡尔树]] $O(n)$ 建树再合并。

当然直接 $insert$ 最方便。
```cpp
int build(){
	for(int i=1;i<=l;++i){
		s[++cnt]=(node){0,0,c[i],rand(),1},lt=0;
		while(t&&s[st[t]].p>s[cnt].p) lt=st[t],pu(lt),--t;//记得pushup
		//找到最后一个priority值比cnt大的作为cnt的左儿子（lt比cnt先加入，排名小）
		if(t) s[st[t]].rs=cnt;//堆底的priority值比cnt节点小，可以作为cnt的父亲（cnt为右儿子因为cnt后加入）
		s[cnt].ls=lt,st[++t]=cnt;
	}
	while(t) pu(st[t]),--t;//pushup！
	return st[1];
}
```
### 中序输出
```cpp
void print(int k){
	if(!k) return ;
	print(s[k].ls),putchar(s[k].v),print(s[k].rs);
}
```
### 空间回收
删除节点后可以放进回收站，下次开新点时优先从回收站取点。
#### [P4008 [NOI2003] 文本编辑器](https://www.luogu.com.cn/problem/P4008)

[code](https://www.luogu.com.cn/record/102714223)

## 区间操作
FHQ Treap 由于基于的核心操作合并与分裂实现，可以支持区间操作（类似线段树，但要注意不只叶子节点有原值，每个点都有）。
### [P3391 【模板】文艺平衡树](https://www.luogu.com.cn/problem/P3391)

[code(码风古早建议忽略去看下一题的操作合集)](https://www.luogu.com.cn/record/35897493)

### ★[P2042 [NOI2005] 维护数列](https://www.luogu.com.cn/problem/P2042) 

建议读懂代码，基本就毕业了

```cpp
#include<bits/stdc++.h>
using namespace std;
#define ll long long
const int N=5e5+5,inf=1e9;
char c[10];
int n,m,pos,x,a[N],t,st[N],tp,rb[N],cnt,u,lt,t0,t1,t2;
struct nd{int ls,rs,sz,v,p,co,re;ll sum,mx,lmx,rmx;}s[N];
void pu(int k){
	s[k].sz=s[s[k].ls].sz+s[s[k].rs].sz+1;
	s[k].sum=s[s[k].ls].sum+s[s[k].rs].sum+s[k].v;
	s[k].mx=max(max(s[s[k].ls].mx,s[s[k].rs].mx),s[s[k].ls].rmx+s[s[k].rs].lmx+s[k].v);
	s[k].lmx=max(s[s[k].ls].lmx,s[s[k].ls].sum+s[k].v+s[s[k].rs].lmx);
	s[k].rmx=max(s[s[k].rs].rmx,s[s[k].rs].sum+s[k].v+s[s[k].ls].rmx);
}
void rev(int k){if(!k) return ;swap(s[k].ls,s[k].rs),swap(s[k].lmx,s[k].rmx),s[k].re^=1;}
void cov(int k,ll x){
	if(!k) return ;s[k].v=s[k].co=x,s[k].sum=s[k].sz*x,
	s[k].mx=max(x,s[k].sum),s[k].lmx=s[k].rmx=max(0ll,s[k].sum);
}
void pd(int k){
	if(s[k].re) rev(s[k].ls),rev(s[k].rs),s[k].re=0;
	if(s[k].co!=inf) cov(s[k].ls,s[k].co),cov(s[k].rs,s[k].co),s[k].co=inf;
}
int build(int n){
	if(!n) return 0;
	for(int i=1;i<=n;++i){
		t0=(tp?rb[tp--]:++cnt),lt=0;
		s[t0]=(nd){0,0,1,a[i],rand(),inf,0,a[i],a[i],max(0,a[i]),max(0,a[i])};
		while(t&&s[st[t]].p>s[t0].p) lt=st[t],pu(lt),--t;
		if(t) s[st[t]].rs=t0;
		s[t0].ls=lt,st[++t]=t0;
	}
	while(t) pu(st[t]),--t;
	return st[1];
}
int merge(int k1,int k2){
	if(!k1||!k2) return k1+k2;
	if(s[k1].p<s[k2].p) return pd(k1),s[k1].rs=merge(s[k1].rs,k2),pu(k1),k1;
	return pd(k2),s[k2].ls=merge(k1,s[k2].ls),pu(k2),k2;
}
void split(int k,int x,int &k1,int &k2){
	if(!k){k1=k2=0;return ;}pd(k);
	if(s[s[k].ls].sz+1<=x) k1=k,split(s[k].rs,x-s[s[k].ls].sz-1,s[k].rs,k2),pu(k);
	else k2=k,split(s[k].ls,x,k1,s[k].ls),pu(k);
}
void del(int k){
	if(!k) return ;
	rb[++tp]=k,del(s[k].ls),del(s[k].rs);
}
int main(){
	scanf("%d%d",&n,&m),srand(time(NULL));
	for(int i=1;i<=n;++i) scanf("%d",&a[i]);
	s[0].mx=-1e18,u=build(n);
	for(int i=1;i<=m;++i){
		scanf("%s",c);
		if(c[0]=='I'){
			scanf("%d%d",&pos,&n);
			for(int i=1;i<=n;++i) scanf("%d",&a[i]);
			split(u,pos,t1,t2),u=merge(merge(t1,build(n)),t2);
		}
		if(c[0]=='D'){
			scanf("%d%d",&pos,&n),--pos;
			split(u,pos,t1,t2),split(t2,n,t0,t2),u=merge(t1,t2),del(t0);
		}
		if(c[2]=='K'){
			scanf("%d%d%d",&pos,&n,&x),--pos;
			split(u,pos,t1,t2),split(t2,n,t0,t2),cov(t0,x),u=merge(merge(t1,t0),t2);
		}
		if(c[0]=='R'){
			scanf("%d%d",&pos,&n),--pos;
			split(u,pos,t1,t2),split(t2,n,t0,t2),rev(t0),u=merge(merge(t1,t0),t2);
		}
		if(c[0]=='G'){
			scanf("%d%d",&pos,&n),--pos,split(u,pos,t1,t2),split(t2,n,t0,t2);
			printf("%lld\n",s[t0].sum),u=merge(merge(t1,t0),t2);
		}
		if(c[2]=='X') printf("%lld\n",s[u].mx);
	}
	return 0;
}
```
## 可持久化
```cpp
int merge(int k1,int k2){
	if(!k1||!k2) return k1+k2;
	int nk=++cnt;
	if(s[k1].p<s[k2].p) return s[nk]=s[k1],s[nk].rs=merge(s[nk].rs,k2),pu(nk),nk;
	return s[nk]=s[k2],s[nk].ls=merge(k1,s[nk].ls),pu(nk),nk;
}
```
```cpp
void split(int k,int val,int &k1,int &k2){
	if(!k){k1=k2=0;return ;}
	if(s[k].v<=val) k1=++cnt,s[k1]=s[k],split(s[k1].rs,val,s[k1].rs,k2),pu(k1);
	else k2=++cnt,s[k2]=s[k],split(s[k2].ls,val,k1,s[k2].ls),pu(k2);
}
```
### [P3835 【模板】可持久化平衡树](https://www.luogu.com.cn/problem/P3835)
关注 $merge$、$split$、$ins$，略有改动。

和可持久化线段树一样，每次树上操作不破坏原来点，而是新开一点。

**注意：由于$split$ 会新开点，$cnt$ 会变，所以在$split$ 递归后不能用 $cnt$ 代表原来新开的点，不然会寄。**

**注意：$merge$ 没有 clone 因为之前 $split$ 时都 clone 了。**
```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=5e5+5,inf=(1<<31)-1;
int n,la,rt[N],u,t0,t1,t2,ty,x,cnt;
struct node{int ls,rs,v,p,sz;}s[N*100];
void pu(int k){s[k].sz=s[s[k].ls].sz+s[s[k].rs].sz+1;}
int merge(int k1,int k2){
	if(!k1||!k2) return k1+k2;
	if(s[k1].p<s[k2].p) return s[k1].rs=merge(s[k1].rs,k2),pu(k1),k1;
	return s[k2].ls=merge(k1,s[k2].ls),pu(k2),k2;
}
/*
int merge(int k1,int k2){
	if(!k1||!k2) return k1+k2;
	int nk=++cnt;
	if(s[k1].p<s[k2].p) return s[nk]=s[k1],s[nk].rs=merge(s[nk].rs,k2),pu(nk),nk;
	return s[nk]=s[k2],s[nk].ls=merge(k1,s[nk].ls),pu(nk),nk;
}
*/
void split(int k,int val,int &k1,int &k2){
	if(!k){k1=k2=0;return ;}
	if(s[k].v<=val) k1=++cnt,s[k1]=s[k],split(s[k1].rs,val,s[k1].rs,k2),pu(k1);
	else k2=++cnt,s[k2]=s[k],split(s[k2].ls,val,k1,s[k2].ls),pu(k2);
}
void ins(int x){
	s[++cnt]=(node){0,0,x,rand(),1},t0=cnt;//存起来！！！cnt会变
	split(u,x,t1,t2),t1=merge(t1,t0),u=merge(t1,t2);
	//split时t1的右路径和t2的左路径都复制过一遍，merge时也只会修改这些点，所以merge时不用clone
	//空间足够的话最好merge也clone，不然写法稍微改变一点都可能会寄（其实正常写没问题，别乱改就行）
}
void del(int x){
	split(u,x,t1,t2),split(t1,x-1,t0,t1);
	u=merge(merge(t0,merge(s[t1].ls,s[t1].rs)),t2);
}
int ran(int x){return split(u,x-1,t1,t2),t0=s[t1].sz+1,u=merge(t1,t2),t0;}
int find(int k,int x){
	if(s[s[k].ls].sz+1==x) return s[k].v;
	if(s[s[k].ls].sz>=x) return find(s[k].ls,x);
	return find(s[k].rs,x-s[s[k].ls].sz-1);
}
int pre(int x){
	split(u,x-1,t1,t2);
	if(!s[t1].sz) return -inf;
	return t0=find(t1,s[t1].sz),u=merge(t1,t2),t0;
}
int sub(int x){
	split(u,x,t1,t2);
	if(!s[t2].sz) return inf;
	return t0=find(t2,1),u=merge(t1,t2),t0;
}
int main(){
	scanf("%d",&n);srand(time(NULL));
	for(int i=1;i<=n;++i){
		scanf("%d%d%d",&la,&ty,&x),u=rt[la];
		if(ty==1) ins(x);
		if(ty==2) del(x);
		if(ty==3) printf("%d\n",ran(x));
		if(ty==4) printf("%d\n",find(u,x));
		if(ty==5) printf("%d\n",pre(x));
		if(ty==6) printf("%d\n",sub(x));
		rt[i]=u;
	}
	return 0;
}
```
### [P5055 【模板】可持久化文艺平衡树](https://www.luogu.com.cn/problem/P5055)
**注意：易错看代码注释。**
```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=2e5+5;
#define ll long long
int n,ty,v,cnt,x,y,u,nt,t0,t1,t2,rt[N];
ll la;
struct node{int ls,rs,sz,v,re,p;ll sum;}s[N<<7];
int clo(int k){return s[nt=++cnt]=s[k],nt;}
void pu(int k){
	s[k].sz=s[s[k].ls].sz+s[s[k].rs].sz+1;
	s[k].sum=s[s[k].ls].sum+s[s[k].rs].sum+s[k].v;
}
void rev(int k){swap(s[k].ls,s[k].rs),s[k].re^=1;}
void pd(int k){//pushdown时要clone，不然可能会影响其他版本
	if(!s[k].re) return;
	if(s[k].ls) s[k].ls=clo(s[k].ls),rev(s[k].ls);
	if(s[k].rs) s[k].rs=clo(s[k].rs),rev(s[k].rs);
	s[k].re=0;
}
int merge(int k1,int k2){//这里merge没有clone因为之前split时都clone了。
	if(!k1||!k2) return k1+k2;
	if(s[k1].p<s[k2].p) return pd(k1),s[k1].rs=merge(s[k1].rs,k2),pu(k1),k1;
	return pd(k2),s[k2].ls=merge(k1,s[k2].ls),pu(k2),k2;
}
void split(int k,int x,int &k1,int &k2){
	if(!k){k1=k2=0;return ;}pd(k);
	if(s[s[k].ls].sz+1>x) k2=clo(k),split(s[k2].ls,x,k1,s[k2].ls),pu(k2);
	else k1=clo(k),split(s[k1].rs,x-s[s[k1].ls].sz-1,s[k1].rs,k2),pu(k1);
}
int main(){
	scanf("%d",&n);srand(time(NULL));
	for(int i=1;i<=n;++i){
		scanf("%d%d",&v,&ty),u=rt[v];
		if(ty==1){
			scanf("%d%d",&x,&y),x^=la,y^=la,split(u,x,t1,t2);
			t0=clo(0),s[t0]=(node){0,0,1,y,0,rand(),y},u=merge(merge(t1,t0),t2);
		}
		if(ty==2){
			scanf("%d",&x),x^=la;
			split(u,x,t1,t2),split(t1,x-1,t1,t0),u=merge(t1,t2);
		}
		if(ty==3){
			scanf("%d%d",&x,&y),x^=la,y^=la;
			split(u,x-1,t1,t0),split(t0,y-x+1,t0,t2),rev(t0),u=merge(merge(t1,t0),t2);
			//可以直接rev(t0)是因为split过已有clone
		}
		if(ty==4){
			scanf("%d%d",&x,&y),x^=la,y^=la;
			split(u,x-1,t1,t0),split(t0,y-x+1,t0,t2);//注意split的问题
			//分裂后相当于变成了两棵树，后一棵树的siz要加上前一棵树的才是原来的siz
			printf("%lld\n",(la=s[t0].sum)),u=merge(merge(t1,t0),t2);
		}
		rt[i]=u;
	}
	return 0;
}
```
