---
public: true
---
#数据结构 

[1](https://www.luogu.com.cn/blog/command-block/kdt-xiao-ji)

[2](https://oiwiki.com/ds/kdt/)
## 概述
k-D Tree(KDT , k-Dimension Tree) 是一种可以 **高效处理 $k$ 维空间信息** 的数据结构。

在结点数 $n$ 远大于 $2^k$ 时，应用 k-D Tree 的时间效率很好。

在算法竞赛的题目中，一般有 $k=2$。在本页面分析时间复杂度时，将认为 $k$ 是常数。
## 建树
![[Pasted image 20230425191439.png]]

为了代码方便，可以把分割点扔到左儿子那边去，与线段树十分相似。

对于切割维度的选择，可以：
1.  每个维度轮着来。
2.  每次选择方差最大的维度作为切割维度。（小优化）

每次在维度上选择切割点时选择该维度上的 **中位数**，这样可以保证每次分成的左右子树大小尽量相等，使构建出的 k-D Tree 的树高最多为 $O(\log n)$。

可以利用 `nth_element(s+l,s+mid,s+r+1,cmp)` 在线性时间内找到 `s[l]` 和 `s[r]` 之间的值按照排序规则 `cmp` 排序后在 `s[mid]` 位置上的值，并保证 `s[mid]` 左边的值小于 `s[mid]`，右边的值大于 `s[mid]`。

因此，建树复杂度 $O(n\log n)$。
## 查询
类似线段树。

需要记录子树内每一维度上的坐标的最大值和最小值，若全在范围内直接返回整棵子树的值，全不在则结束，否则递归子树。

**复杂度：**

![[Pasted image 20230425193118.png]]
![[Pasted image 20230425193143.png]]
![[Pasted image 20230425193158.png]]
## 标记
参考线段树
## [P4631 [APIO2018] 选圆圈](https://www.luogu.com.cn/problem/P4631)
把圆变成矩形 $[x−r,x+r],[y−r,y+r]$ 放到 k-D Tree 里。每个圆找覆盖范围内的圆判断是否相交，相交则标记、删去、pushup。

复杂度玄学，可以旋转一个角。
```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=3e5+5;
#define db double
const db eps=1e-4,sn=0.5,cs=sqrt(3)*0.5;
int n,ans[N];
db x,y,xl,xr,yl,yr;
struct cir{db x,y;int r,id;}a[N],t;
bool cmp(cir a,cir b){return a.r==b.r?a.id<b.id:a.r>b.r;}
bool cmpx(cir a,cir b){return a.x<b.x;}
bool cmpy(cir a,cir b){return a.y<b.y;}
struct kdt{db xl,xr,yl,yr;int sz;cir e;}s[N<<2];
#define ls k<<1
#define rs k<<1|1
void pu(int k){
	s[k].sz=s[ls].sz+s[rs].sz;
	s[k].xl=min(s[ls].xl,s[rs].xl),s[k].yl=min(s[ls].yl,s[rs].yl);
	s[k].xr=max(s[ls].xr,s[rs].xr),s[k].yr=max(s[ls].yr,s[rs].yr);
}
void build(int l,int r,int k,int ty){
	if(l==r){s[k].xl=a[l].x-a[l].r,s[k].xr=a[l].x+a[l].r,s[k].yl=a[l].y-a[l].r,s[k].yr=a[l].y+a[l].r,s[k].sz=1,s[k].e=a[l];return ;}
	int mi=(l+r)>>1;nth_element(a+l,a+mi,a+r+1,ty?cmpx:cmpy);
	build(l,mi,ls,ty^1),build(mi+1,r,rs,ty^1),pu(k);
}
int check(cir a,cir b){return (a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y)-eps<=1.0*(a.r+b.r)*(a.r+b.r);}
void find(int k){
	if(!s[k].sz||s[k].xl-eps>xr||s[k].xr+eps<xl||s[k].yl-eps>yr||s[k].yr+eps<yl) return ;
	if(s[k].e.r){
		if(check(s[k].e,t)) ans[s[k].e.id]=t.id,s[k].sz=0,s[k].xl=s[k].yl=2e9,s[k].xr=s[k].yr=-2e9;
		return;
	}
	find(ls),find(rs),pu(k);
}
int main(){
	scanf("%d",&n);
	for(int i=1;i<=n;++i)
		scanf("%lf%lf%d",&x,&y,&a[i].r),a[i].id=i,a[i].x=x*sn-y*cs,a[i].y=x*cs+y*sn;
	build(1,n,1,0),sort(a+1,a+1+n,cmp);
	for(int i=1;i<=n;++i)if(!ans[a[i].id]) t=a[i],xl=t.x-t.r,xr=t.x+t.r,yl=t.y-t.r,yr=t.y+t.r,find(1);
	for(int i=1;i<=n;++i) printf("%d ",ans[i]);
	return 0;
}
```
## 插入
![[Pasted image 20230425193921.png]]

## [P4148 简单题](https://www.luogu.com.cn/problem/P4148)
模板题。

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=2e5+5;
int n,la,ty,lcnt,cnt,xl,yl,xr,yr,ans;
#define ll long long
#define ls k<<1
#define rs k<<1|1
struct node{int x,y,w;}a[N];
bool cmpx(node a,node b){return a.x<b.x;}
bool cmpy(node a,node b){return a.y<b.y;}
struct kdt{int xl,yl,xr,yr;ll sum;}s[N<<2];
void build(int l,int r,int k,int ty){
	if(l==r){s[k].xl=s[k].xr=a[l].x,s[k].yl=s[k].yr=a[l].y,s[k].sum=a[l].w;return;}
	int mi=(l+r)>>1;nth_element(a+l,a+mi,a+r+1,ty?cmpy:cmpx);
	build(l,mi,ls,ty^1),build(mi+1,r,rs,ty^1),s[k].sum=s[ls].sum+s[rs].sum;
	s[k].xl=min(s[ls].xl,s[rs].xl),s[k].yl=min(s[ls].yl,s[rs].yl);
	s[k].xr=max(s[ls].xr,s[rs].xr),s[k].yr=max(s[ls].yr,s[rs].yr);
}
void ask(int k){
	if(s[k].xl>xr||s[k].xr<xl||s[k].yl>yr||s[k].yr<yl) return;
	if(xl<=s[k].xl&&s[k].xr<=xr&&yl<=s[k].yl&&s[k].yr<=yr){ans+=s[k].sum;return;}
	ask(ls),ask(rs);
}
void solve(){
	scanf("%d",&ty);
	if(ty==3) exit(0);
	if(ty==1){
		++cnt,scanf("%d%d%d",&a[cnt].x,&a[cnt].y,&a[cnt].w);
		a[cnt].x^=la,a[cnt].y^=la,a[cnt].w^=la;
		if((cnt-lcnt)*(cnt-lcnt)>=cnt*20) build(1,lcnt=cnt,1,0);
	}
	else{
		scanf("%d%d%d%d",&xl,&yl,&xr,&yr),xl^=la,yl^=la,xr^=la,yr^=la;
		ans=0,ask(1);
		for(int i=lcnt+1;i<=cnt;++i)
			if(xl<=a[i].x&&a[i].x<=xr&&yl<=a[i].y&&a[i].y<=yr) ans+=a[i].w;
		la=ans,printf("%d\n",ans);
	}
}
int main(){
	scanf("%d",&n);
	while(1) solve();
	return 0;
}
```
