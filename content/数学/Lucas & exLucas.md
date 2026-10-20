---
public: true
---
#数学 #组合 
## Lucas
[部分摘自OIWIKI](https://oi-wiki.org/math/number-theory/lucas/)
### 内容
对于质数 $p$，有
$$\binom{n}{m}\bmod p = \binom{\left\lfloor n/p \right\rfloor}{\left\lfloor m/p\right\rfloor}\cdot\binom{n\bmod p}{m\bmod p}\bmod p$$
### 证明
[click  here](https://www.luogu.com.cn/blog/28007/lucas)
### 适用
Lucas 定理用于求解大组合数取模的问题，其中模数必须为素数。正常的组合数运算可以通过递推公式求解，但当**问题规模很大**，而**模数是一个不大的质数**的时候，就不能简单地通过递推求解来得到答案，需要用到 Lucas 定理。$p$ 的范围不能够太大，一般在 $10^5$ 左右。

时间复杂度为 $O(f(p) + g(n)\log n)$，其中 $f(n)$ 为预处理组合数的复杂度，$g(n)$ 为单次求组合数的复杂度（无需科技的话为 $1$）。
### 模板
```cpp
#include<bits/stdc++.h>
using namespace std;
long long t,n,m,p,a[200005],inv[100005];//inv--线性求逆元 
long long C(long long x,long long y){
	if(y>x) return 0;
	return a[x]*inv[a[y]]%p*inv[a[x-y]]%p;
}
long long lucas(long long x,long long y){
	if(y==0) return 1;
	return lucas(x/p,y/p)*C(x%p,y%p)%p;
}
int main(){
	scanf("%lld",&t);
	while(t--){
		scanf("%lld%lld%lld",&n,&m,&p);
		a[0]=a[1]=inv[0]=inv[1]=1;//注意 0! = 1 ！！！！！！！！ 
		for(int i=2;i<=n+m;++i) a[i]=a[i-1]*i%p;
		for(int i=2;i<=p;++i) inv[i]=(p-(p/i))*inv[p%i]%p;
		printf("%lld\n",lucas(n+m,n));
	}
	return 0;
}
```
### [10235. 「一本通 6.6 练习 6」序列统计](https://loj.ac/p/10235)

![[Pasted image 20230922183029.png]]

#### 重要定理：
$$C_{x}^{0}+C_{x+1}^{1}+C_{x+2}^{2}+...+C_{x+k}^{k}=C_{x+k+1}^{k}$$
画一下杨辉三角可证明。（在 $C_{x+1}^{1}$ 补一个 $1$ ，一路往下加）

上述定理转化+lucas即可。

[code](https://loj.ac/s/1627187)
### [P4345 [SHOI2015]超能粒子炮·改](https://www.luogu.com.cn/problem/P4345)

[题解](https://www.luogu.com.cn/blog/asuldb/solution-p4345)

![[Pasted image 20230922183053.png]]

[code](https://www.luogu.com.cn/record/93436787)
## exLucas
这个和上面没半毛钱关系，只是功能更强大。

求解大组合数取模运算且**模数是一个不大的数**时，exLucas 就要派上用场了。
### 求单个组合数：
#### [P4720 【模板】扩展卢卡斯定理/exLucas](https://www.luogu.com.cn/problem/P4720)

时间复杂度约为 $p^k\log(p^k)$ 。

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=1e3+5;
#define ll long long
ll n,m,mod,sq,cnt,b[N],p[N],t,x,y,po,ans;
ll poww(ll a,ll b,ll mk){
	po=1,a%=mk;
	while(b){
		if(b&1) po=po*a%mk;
		a=a*a%mk,b>>=1;
	}
	return po;
}
ll spr(ll a,ll mm,ll mk){
	ll cir=1,res=1;
	for(ll i=2;i<=mk;++i) if(i%mm)cir=cir*i%mk;
	cir=poww(cir,a/mk,mk);
	for(ll i=2;i<=a%mk;++i) if(i%mm)res=res*(i%mk)%mk;
	ll qwq=(a/mm?spr(a/mm,mm,mk):1)*cir%mk*res%mk;
	return qwq;
}
void exgcd(ll a,ll b){
	if(!b) return x=1,y=0,void();
	exgcd(b,a%b),t=x,x=y,y=t-a/b*y;
}
ll inv(ll a,ll mm){exgcd(a,mm);return (x%mm+mm)%mm;}
ll mi(ll a,ll mm){return (a<mm?0:a/mm+mi(a/mm,mm));}
ll getC(ll mm,ll mk){
	ll s1=spr(n,mm,mk),s2=spr(m,mm,mk),s3=spr(n-m,mm,mk);
	return s1*inv(s2,mk)%mk*inv(s3,mk)%mk*poww(mm,mi(n,mm)-mi(m,mm)-mi(n-m,mm),mk)%mk;
}
void exlucas(){
	ll mm,mk;
	sq=sqrt(mod),mm=mod;
	for(ll i=2;i<=sq;++i)
		if(mm%i==0){
			mk=1;
			while(mm%i==0) mm/=i,mk*=i;
			p[++cnt]=mk,b[cnt]=getC(i,mk);
		}
	if(mm!=1) p[++cnt]=mm,b[cnt]=getC(mm,mm);
	for(ll i=1;i<=cnt;++i) ans=(ans+b[i]*(mod/p[i])%mod*inv(mod/p[i],p[i])%mod)%mod;
}
int main(){
	scanf("%lld%lld%lld",&n,&m,&mod);
	exlucas(),printf("%lld",ans);
	return 0;
}
```
### 求多个组合数
对每个质因子 $p$  ，对每个 $n\le p^k$ 预处理出小于等于它且不整除 $p$ 的数字之积。这样的话，求阶乘的复杂度会变成  $O(\log_{p^k}n)$ ，总复杂度就可以降到 $O(\sum p^k +T\log_{p^k} n)$ 。

采用欧拉定理+光速幂可以达到 $O(\sqrt{p}+\sum p_i^{c_i})$ 预处理 $O(\log p)$ 回答。（代码咕咕）

#### [P2183 [国家集训队]礼物](https://www.luogu.com.cn/problem/P2183)
先求 $n!$ ，再去序。

答案为：
$$\frac{n!}{\prod \limits_{i=1}^mw_{i}!*(n-\sum \limits_{i=1}^mw_{i})!} \mod P$$

利用 exLucas 的思想，算出$\frac{n!}{\prod \limits_{i=1}^mw_{i}!*(n-\sum \limits_{i=1}^mw_{i})!} \mod p^k$ （提出阶乘的因子 $p$ ），再用 CRT 合并。

[code](https://www.luogu.com.cn/record/93538263)（预处理阶乘）
