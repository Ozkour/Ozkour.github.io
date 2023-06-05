import csv
from collections import Counter
import math

data2016 = list()
data2017 = list()
data2018 = list()
data2019 = list()

counts = {}
dicEU = {}
# open file for reading
with open('chi-data.csv') as csvDataFile:
    # read file as csv file 
    csvReader = csv.reader(csvDataFile)
    # for every row, print the row
    for i,row in enumerate(csvReader):
        if row[0] != "":
            data2016.append(row[0])
        if row[1] != "":
            data2017.append(row[1])
        if row[2] != "":
            data2018.append(row[2])
        if row[3] != "":
            data2019.append(row[3])


datas = data2016[1:] + data2017[1:] + data2018[1:] + data2019[1:]
for data in datas:
    if data not in counts:
        counts[data] = {2016: data2016.count(data), 2017: data2017.count(data), 2018: data2018.count(data), 2019: data2019.count(data)}

# with open('chi-countries-counts.csv', 'w', newline='') as csvfile:
#     writer = csv.writer(csvfile, delimiter=',')
#     writer.writerow(['Country', 'y2016', 'y2017', 'y2018', 'y2019' ])
#     for data in counts:
#         writer.writerow([data, counts[data][2016], counts[data][2017], counts[data][2018], counts[data][2019]])
print(Counter(data2019))
# for data in data2019[2:]:
#     if data not in dicEU:
#         dicEU[data] = data2019.count(data)
# print("NA")
# print(sum(dicNA.values()))
# print({k: v for k, v in sorted(dicNA.items(), key=lambda item: item[1])})
# print("\nEU")
# print(sum(dicEU.values()))
# print({k: v for k, v in sorted(dicEU.items(), key=lambda item: item[1])})

# def convert(deg):
#     return deg*math.pi/180

# phi1 = convert(33.9425222)
# phi2 = convert(49.00972222)
# lam1 = convert(-118.4071611)
# lam2 = convert(2.54861111)
# d = 2*6371.009*math.asin(math.sqrt(math.sin((phi2-phi1)/2)**2+math.cos(phi1)*math.cos(phi2)*math.sin((lam2-lam1)/2)**2))
# print(d)


# print(phi1,phi2,lam1,lam2)