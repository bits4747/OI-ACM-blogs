---
public: true
---
## 模板
### dfs记忆化搜索写法
![[Pasted image 20230926162006.png]]

**注意：**
1. **$dp$ 最好初值赋为 $-1$，尤其是答案多为 $0$ 时，否则容易超时。**

### 递推写法......

## 例题
### [P4127 [AHOI2009] 同类分布](https://www.luogu.com.cn/problem/P4127)
枚举数位和作为模数，dfs 最后判断数位和是否为模数，以及在模当前枚举的数位和时是否为 $0$。

```cpp
#include<bits/stdc++.h>
using namespace std;
#define ll long long
int t,a[20],p;
ll l,r,f[20][180][180];
ll dfs(int k,int st,int s,int l){
	if(!k) return (s==p)&&!st;
	if(~f[k][st][s]&&!l) return f[k][st][s];
	int res=(l?a[k]:9);ll sum=0;
	for(int i=0;i<=res;++i) sum+=dfs(k-1,(st*10+i)%p,s+i,l&(i==a[k]));
	if(!l) f[k][st][s]=sum;
	return sum;
}
ll ask(ll x){
	t=0;ll ans=0;
	while(x) a[++t]=x%10,x/=10;
	for(p=t*9;p;--p) memset(f,-1,sizeof(f)),ans+=dfs(t,0,0,1);
	return ans;
}
int main(){
	scanf("%lld%lld",&l,&r);
	printf("%lld",ask(r)-ask(l-1));
	return 0;
}
```

### [P3286 [SCOI2014] 方伯伯的商场之旅](https://www.luogu.com.cn/problem/P3286)
首先，集合在石子的中位数一定是最优的。

不妨先统一集合在最低位，再不断往高位挪，当可减少的距离为负时，说明上一位是最优解。

因此，我们 dfs $k$ 次，第一次算出集合在第一位的花费，然后每次算出往左挪一位可减少的花费，若小于 $0$ 则不减。

```cpp
#include<bits/stdc++.h>
using namespace std;
#define ll long long
ll l,r,f[100][10000];
int K,a[100],p,t;
ll dfs(int k,int s,int l){
	if(s<0) return 0;
	if(!k) return s;
	if(!l&&~f[k][s]) return f[k][s];
	int res=(l?a[k]:K-1);ll sum=0;
	for(int i=0;i<=res;++i) sum+=dfs(k-1,s+(p==1?i*(k-1):(k<p?-i:i)),l&(i==res));
	if(!l) f[k][s]=sum;
	return sum;
}
ll ask(ll x){
	t=0;ll ans=0;
	while(x) a[++t]=x%K,x/=K;
	for(p=1;p<=t;++p)
		memset(f,-1,sizeof(f)),ans+=(p==1?1:-1)*dfs(t,0,1);
	return ans;
}
int main(){
	scanf("%lld%lld%d",&l,&r,&K);
	printf("%lld",ask(r)-ask(l-1));
}
```

### [#10168. 「一本通 5.3 练习 3」恨 7 不成妻](https://loj.ac/p/10168)
如果一个整数符合下面3个条件之一，那么我们就说这个整数和7有关——

1、整数中某一位是7；

2、整数的每一位加起来的和是7的整数倍；

3、这个整数是7的整数倍；
现在问题来了：吉哥想知道在一定区间内和7无关的数字的平方和。

**dp(记忆化搜索)一定不能记录num（数）且在！k时才返回--否则就是纯暴力！！！** 

计算答案贡献：	 (推自完全平方公式)

$$S0+=s0$$
$$S1+=s1+s0*si$$
$$S2+=s2+2*s1*si+s0*si^2$$

**因此，正常情况dfs返回ans一值，但此题需返回三元组{个数，一次方和，二次方和} ！！！** 

```cpp
#include<bits/stdc++.h>
using namespace std;
int t,a[19],len;
long long l,r,mod=1000000007,p[19];
struct node{long long s0,s1,s2;}f[19][7][7]; 
node dfs(int k,int sum,int st,bool lim) {
	if(!k) return {(sum&&st),0,0};
	if(!lim&&f[k][sum][st].s0!=-1) return f[k][sum][st];
	node ans={0,0,0},s;
	for(int i=0;i<=(lim?a[k]:9);++i)
		if(i!=7){
			s=dfs(k-1,(sum+i)%7,(st*10+i)%7,lim&&(i==a[k]));
			long long si=i*p[k-1]%mod;
			ans.s0=(ans.s0+s.s0)%mod,ans.s1=(ans.s1+s.s1+s.s0*si%mod)%mod;
			ans.s2=(ans.s2+s.s2+2*s.s1%mod*si%mod+s.s0*si%mod*si%mod)%mod;
		}
	return lim?ans:f[k][sum][st]=ans;
}
long long apart(long long x) {
	len=0;
	while(x) a[++len]=x%10,x/=10;
	node ans=dfs(len,0,0,1);
	return ans.s2;
}
int main() {
	scanf("%d",&t);
	p[0]=1;
	for(int i=1;i<19;++i) p[i]=p[i-1]*10%mod;
	for(int i=0;i<19;++i)
		for(int j=0;j<7;++j)
			for(int k=0;k<7;++k) f[i][j][k].s0=-1;
	while(t){
		scanf("%lld%lld",&l,&r),--t;
		printf("%lld\n",(apart(r)+mod-apart(l-1))%mod);
	}
	return 0;
}
```

### [CF55D Beautiful numbers - 洛谷](https://www.luogu.com.cn/problem/CF55D)

**题意：** 有T组询问，每次询问区间 $[l, r]$ 中有多少个数可以被组成它的数字整除。

**题解：** 

只跟当前数模 $lcm(1,2,...,9)=2520$ 和数位上出现了1..9这些数字有关，那么记录 $dp[len][pre][lcm]$ 表示当前 $len$ 位各个数字 $lcm$ 以及模 $2520$ 的余数 $pre$ ，进行记忆化搜索。

空间为 $20*2520*2520$ 会炸，发现第三维有很多无用空间，可以只记录 $2520$ 的因数，有 $48$ 个。
