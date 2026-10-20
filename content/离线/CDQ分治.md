---
public: true
---
#离线 
## 引入
解决形如求 $a_j \leq a_i$ 且 $b_j \leq b_i$ 的 $(i,j)$ 数量/贡献称之为二维偏序，通常用树状数组等简单数据结构解决。多一维 $c_j \leq c_i$ 条件时就该上 $CDQ$ 分治了。（当然，可以多层 $CDQ$ 嵌套实现多维偏序）。

$CDQ$ 分治通常支持将带修数据结构题离线（可理解为加上一维时间）转为静态问题。
## 易错
1. 注意 $CDQ$ 分治的顺序，如是否需要左中右。
2. $sort$ 不具有稳定性，注意 $cmp$ 是否要写完整（建议手写归并）。
3. 要不重不漏，如点对是否有顺序之分，带绝对值的是否两边都要计算贡献等。
4. 注意合并同类项（三维相同）。
## 三维偏序
大致按难度排序（从板子到应用）
###  [P3810 【模板】三维偏序（陌上花开）](https://www.luogu.com.cn/problem/P3810)
$a_j \leq a_i$ 且 $b_j \leq b_i$ 且 $c_j \leq c_i$ 且 $j \ne i$ 的数量。

[code](https://www.luogu.com.cn/record/78287384)
### [P3364 Cool loves touli](https://www.luogu.com.cn/problem/P3364)
$l_j \leq l_i$ 且 $a_j \leq s_i$ 且 $w_j \leq a_i$ 且 $j \ne i$ 的数量。
```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=1e5+5;
int n,cnt,b[N*3],tr[N*3],ans;
struct node{int l,s,w,a,f;}s[N];
bool cmpl(node x,node y){return x.l<y.l;}
bool cmpa(node x,node y){return x.a<y.a;}
bool cmps(node x,node y){return x.s<y.s;}
void add(int k,int v){for(;k<=cnt;k+=k&-k) tr[k]=max(v,tr[k]);}
void cle(int k){for(;k<=cnt;k+=k&-k) tr[k]=0;}
int ask(int k){int re=0;for(;k;k-=k&-k) re=max(re,tr[k]);return re;}
void cdq(int l,int r){
	if(l>=r) return ;
	int mi=(l+r)>>1,sl=l,el=mi,sr=mi+1,er=r;
	cdq(l,mi);
	sort(s+l,s+mi+1,cmpa),sort(s+mi+1,s+r+1,cmps);
	while(sr<=er){
		while(sl<=el&&s[sl].a<=s[sr].s) add(s[sl].w,s[sl].f),++sl;
		s[sr].f=max(ask(s[sr].a)+1,s[sr].f),++sr;
	}
	sl=l,el=mi,sr=mi+1,er=r;
	while(sr<=er){
		while(sl<=el&&s[sl].a<=s[sr].s) cle(s[sl].w),++sl;
		++sr;
	}
	sort(s+l,s+r+1,cmpl);
	cdq(mi+1,r);
}
int main(){
	scanf("%d",&n);
	for(int i=1;i<=n;++i){
		scanf("%d%d%d%d",&s[i].l,&s[i].s,&s[i].w,&s[i].a);
		b[++cnt]=s[i].s,b[++cnt]=s[i].w,b[++cnt]=s[i].a,s[i].f=1;
	}
	sort(s+1,s+n+1,cmpl),sort(b+1,b+1+cnt),cnt=unique(b+1,b+1+cnt)-(b+1);
	for(int i=1;i<=n;++i)
		s[i].s=lower_bound(b+1,b+1+cnt,s[i].s)-b,
		s[i].w=lower_bound(b+1,b+1+cnt,s[i].w)-b,
		s[i].a=lower_bound(b+1,b+1+cnt,s[i].a)-b;
	cdq(1,n);
	for(int i=1;i<=n;++i) ans=max(ans,s[i].f);
	printf("%d",ans);
	return 0;
}
```
### [P3658 [USACO17FEB]Why Did the Cow Cross the Road III P](https://www.luogu.com.cn/problem/P3658)
$posa_j < posa_i$ 且 $posb_j > posb_i$ 且 $|j-i| \leq k$ 的数量。

[code](https://www.luogu.com.cn/record/102169063)
### [P4390 [BOI2007]Mokia 摩基亚](https://www.luogu.com.cn/problem/P4390)
询问一拆四。

$t_j < t_i$ 且 $x_j \leq x_i$ 且 $y_j \leq y_i$ 且 $j \ne i$ 贡献。

[code](https://www.luogu.com.cn/record/102565156)
### [P4093 [HEOI2016/TJOI2016]序列](https://www.luogu.com.cn/problem/P4093)
如果没有修改，就是简单的树状数组求最长上升子序列。

记 $i$ 最大变为 $mx_i$，最小变为 $mn_i$，则须满足 $i < j$ 且 $mx_i \leq a_j$ 且 $a_i \leq mn_j$。

[code](https://www.luogu.com.cn/record/102125967)
### [CF1045G AI robots](https://www.luogu.com.cn/problem/CF1045G)
**题意：** 火星上有$N$个机器人排成一行，第$i$个机器人的位置为$x_{i}$，视野为$r_{i}$，智商为$q_{i}$。我们认为第$i$个机器人可以看到的位置是$[x_{i}-r_{i},x_{i}+r_{i}]$。	
如果一对机器人相互可以看到，且它们的智商$q_{i}$的差距**不大于**$K$，那么它们会开始聊天。请计算有多少对机器人可能会聊天。

**题解：** $r$ 为第一维从大到小排序，可以保证右边能看见左边就可能互相看见。$q$ 为第二维双指针维护，$x$ 为第三维树状数组维护。

[code](https://www.luogu.com.cn/record/102149062)
### [P3157 [CQOI2011]动态逆序对](https://www.luogu.com.cn/problem/P3157)
时间倒流，求出每添加一个数新增的逆序对数量。

由于是一个一个数插入，统计逆序对要算上 $a_j > a_i$ 且 $j < i$ 和 $a_i > a_j$ 且 $i < j$ 的。

[code](https://www.luogu.com.cn/record/78269153)
### [P4169 [Violet]天使玩偶/SJY摆棋子](https://www.luogu.com.cn/problem/P4169)
每次翻转一下，四次求在左下角的最小距离。

卡常题，数组备份后每次 $CDQ$ 前不用重新按时间排序。

[code](https://www.luogu.com.cn/record/102118293)
### [CF848C Goodbye Souvenir](https://www.luogu.com.cn/problem/CF848C)
最后一次出现位置的下标减去第一次出现位置的下标等于任意两个相邻下标之差的和。

可以用 $set$ 维护上一个出现的位置。

求 $t_i < t_j$且 $i \leq r_j$  且 $l_j \leq pre_i$ 的贡献。
```cpp
#include<bits/stdc++.h>
using namespace std;
#define ll long long
const int N=1e5+5;
int n,m,co[N],a,b,c,cnt,qc,tmp;
ll tr[N],ans[N];
set<int>q[N];
set<int>::iterator it,lit,rit;
struct node{int ty,a,b,id;}s[N*7];
bool cmp(node x,node y){return x.a>y.a;}
void add(int k,int v){for(;k<=n;k+=k&-k) tr[k]+=v;}
ll ask(int k){ll re=0;for(;k;k-=k&-k) re+=tr[k];return re;}
void cdq(int l,int r){
	if(l>=r) return ;
	int mi=(l+r)>>1,sl=l,el=mi,sr=mi+1,er=r;
	cdq(l,mi),cdq(mi+1,r);
	while(sr<=er){
		while(sl<=el&&s[sl].a>=s[sr].a){
			if(s[sl].ty) add(s[sl].b,s[sl].ty*(s[sl].b-s[sl].a));
			++sl;
		}
		if(!s[sr].ty) ans[s[sr].id]+=ask(s[sr].b);
		++sr;
	}
	sl=l,el=mi,sr=mi+1,er=r;
	while(sr<=er){
		while(sl<=el&&s[sl].a>=s[sr].a){
			if(s[sl].ty) add(s[sl].b,-s[sl].ty*(s[sl].b-s[sl].a));
			++sl;
		}
		++sr;
	}
	sort(s+l,s+r+1,cmp);
}
int main(){
	scanf("%d%d",&n,&m);
	for(int i=1;i<=n;++i){
		scanf("%d",&co[i]),q[co[i]].insert(i);
		if(q[co[i]].size()>1) s[++cnt]=(node){1,*(--q[co[i]].rbegin()),i,0};
	}
	for(int i=1;i<=m;++i){
		scanf("%d%d%d",&a,&b,&c);
		if(a==1){
			lit=rit=it=q[co[b]].find(b),--lit,++rit;
			if(rit!=q[co[b]].end()){
				s[++cnt]=(node){-1,b,*rit,0};
				if(it!=q[co[b]].begin()) s[++cnt]=(node){1,*lit,*rit,0};
			}
			if(it!=q[co[b]].begin()) s[++cnt]=(node){-1,*lit,b,0};
			q[co[b]].erase(b),q[c].insert(b),co[b]=c;
			lit=rit=it=q[c].find(b),--lit,++rit;
			if(rit!=q[c].end()){
				s[++cnt]=(node){1,b,*rit,0};
				if(it!=q[c].begin()) s[++cnt]=(node){-1,*lit,*rit,0};
			}
			if(it!=q[c].begin()) s[++cnt]=(node){1,*lit,b,0};
		}
		else s[++cnt]=(node){0,b,c,++qc};
	}
	cdq(1,cnt);
	for(int i=1;i<=qc;++i) printf("%lld\n",ans[i]);
	return 0;
}
```
### [P2487 [SDOI2011]拦截导弹](https://www.luogu.com.cn/problem/P2487)
先一遍 $CDQ$ 求以 $i$ 结尾的最多拦截数量及方案数，再一遍 $CDQ$ 求以 $i$ 开头的最多拦截数量及方案数，乘法原理统计 $i$ 被选中的概率。

会爆 $long~long$，要开 $double$。

[code](https://www.luogu.com.cn/record/78333284)
## 四维偏序（cdq套cdq）
### [P3769 [CH弱省胡策R2]TATT](https://www.luogu.com.cn/problem/P3769)
```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=5e4+5;
int n,cnt,a[N],tr[N],ans,sum,tot;
struct node{int a,b,c,d,f,ty,t;}s[N];
bool cmpa(node x,node y){return x.a==y.a?(x.b==y.b?(x.c==y.c?x.d<y.d:x.c<y.c):x.b<y.b):x.a<y.a;}
bool cmpb(node x,node y){return x.b==y.b?(x.a==y.a?(x.c==y.c?x.d<y.d:x.c<y.c):x.a<y.a):x.b<y.b;}
bool cmpc(node x,node y){return x.c<y.c;}
void add(int k,int v){for(;k<=cnt;k+=k&-k) tr[k]=max(tr[k],v);}
void cle(int k){for(;k<=cnt;k+=k&-k) tr[k]=0;}
int ask(int k){int re=0;for(;k;k-=k&-k) re=max(re,tr[k]);return re;}
void cdq(int l,int r){
	if(l>=r) return ;
	int mi=(l+r)>>1,sl=l,el=mi,sr=mi+1,er=r;
	cdq(l,mi);
	sort(s+sl,s+el+1,cmpc),sort(s+sr,s+er+1,cmpc);
	while(sr<=er){
		while(sl<=el&&s[sl].c<=s[sr].c){
			if(!s[sl].ty) add(s[sl].d,s[sl].f);
			++sl;
		}
		if(s[sr].ty) s[sr].f=max(s[sr].f,ask(s[sr].d)+s[sr].t);
		++sr;
	}
	for(int i=l;i<=mi;++i)if(!s[i].ty) cle(s[i].d);
	sort(s+l,s+r+1,cmpb),cdq(mi+1,r);
}
void CDQ(int l,int r){
	if(l>=r) return ;
	int mi=(l+r)>>1;
	CDQ(l,mi);
	for(int i=l;i<=r;++i) s[i].ty=(i>mi);
	sort(s+l,s+r+1,cmpb),cdq(l,r);
	sort(s+l,s+r+1,cmpa),CDQ(mi+1,r);
}
int main(){
	scanf("%d",&n);
	for(int i=1;i<=n;++i) scanf("%d%d%d%d",&s[i].a,&s[i].b,&s[i].c,&s[i].d),a[i]=s[i].d;
	sort(a+1,a+1+n),cnt=unique(a+1,a+1+n)-(a+1);
	for(int i=1;i<=n;++i) s[i].d=lower_bound(a+1,a+1+cnt,s[i].d)-a;
	sort(s+1,s+1+n,cmpa);
	sum=1;
	for(int i=2;i<=n;++i){
		if(s[i].a==s[i-1].a&&s[i].b==s[i-1].b&&s[i].c==s[i-1].c&&s[i].d==s[i-1].d) ++sum;
		else s[++tot]=s[i-1],s[tot].f=s[tot].t=sum,sum=1;	
	}
	s[++tot]=s[n],s[tot].f=s[tot].t=sum,n=tot,CDQ(1,n);
	for(int i=1;i<=n;++i) ans=max(ans,s[i].f);
	printf("%d",ans);
	return 0;
}
```
### [P4849 寻找宝藏](https://www.luogu.com.cn/problem/P4849)
和上一题一样，不过要多统计方案数。

[code](https://www.luogu.com.cn/record/102138416)
## 其他
- [P4690 [Ynoi2016]镜中的昆虫](https://www.luogu.com.cn/problem/P4690)：
- [P3206 [HNOI2010]城市建设](https://www.luogu.com.cn/problem/P3206)：~~各种分治好像都能做~~，求动态最小生成树

## 斜率优化+cdq分治
- [P4027 [NOI2007]货币兑换](https://www.luogu.com.cn/problem/P4027)

- [P4655 [CEOI2017]Building Bridges](https://www.luogu.com.cn/problem/P4655)

- [CF932F Escape Through Leaf](https://www.luogu.com.cn/problem/CF932F)

不过建议上李超树。
