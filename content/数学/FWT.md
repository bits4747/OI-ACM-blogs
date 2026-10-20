---
public: true
---
#数学 
## [P4717 【模板】快速莫比乌斯/沃尔什变换 (FMT/FWT)](https://www.luogu.com.cn/problem/P4717)

```cpp
#include<bits/stdc++.h> 
using namespace std;
const int N=1<<17,p=998244353;
int n,A[N],B[N],a[N],b[N];
void clear(){for(int i=0;i<n;++i) a[i]=A[i],b[i]=B[i];}
void mul(){for(int i=0;i<n;++i) a[i]=1ll*a[i]*b[i]%p;}
void print(){for(int i=0;i<n;++i) printf("%d ",a[i]);printf("\n");}
void OR(int f[],int ty){
	for(int l=1;l<n;l<<=1)for(int i=0;i<n;i+=l+l)
		for(int j=0;j<l;++j) (f[i+j+l]+=1ll*f[i+j]*ty%p)%=p;
}
void AND(int f[],int ty){
	for(int l=1;l<n;l<<=1)for(int i=0;i<n;i+=l+l)
		for(int j=0;j<l;++j) (f[i+j]+=1ll*f[i+j+l]*ty%p)%=p;
}
void XOR(int f[],int ty){
	for(int l=1;l<n;l<<=1)for(int i=0;i<n;i+=l+l)for(int j=0;j<l;++j)
		(f[i+j]+=f[i+j+l])%=p,f[i+j+l]=(f[i+j]+p-f[i+j+l]*2%p)%p,
		f[i+j]=1ll*f[i+j]*ty%p,f[i+j+l]=1ll*f[i+j+l]*ty%p;
}
int main(){
	scanf("%d",&n),n=1<<n;
	for(int i=0;i<n;++i) scanf("%d",&A[i]);
	for(int i=0;i<n;++i) scanf("%d",&B[i]);
	clear(),OR(a,1),OR(b,1),mul(),OR(a,p-1),print();
	clear(),AND(a,1),AND(b,1),mul(),AND(a,p-1),print();
	clear(),XOR(a,1),XOR(b,1),mul(),XOR(a,499122177),print();
	return 0;
}
```
