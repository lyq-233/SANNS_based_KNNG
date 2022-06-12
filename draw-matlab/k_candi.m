x = 20:-1:6;%x轴上的数据，第一个值代表数据开始，第二个值代表间隔，第三个值代表终止
candiSize =  [169.41052631578947,179.96938775510205,195.03092783505156,216.6530612244898,209.83673469387756,237.59595959595958,262.42,272.2828282828283,343.36,436,515.71,755.12,1066.74,1652.63,2628.92];
plot(x,  candiSize, '-om'); %线性，颜色，标记
axis([6,20,0,3000])  %确定x轴与y轴框图大小
set(gca,'XTick',[6:1:20]) %x轴范围间隔
set(gca,'YTick',[0:300:3000]) %y轴范围间隔
legend('候选集规模Nr');   %右上角标注
xlabel('哈希函数个数K')  %x轴坐标描述
ylabel('候选集规模Nr') %y轴坐标描述