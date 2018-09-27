using System;
using System.Diagnostics;

namespace vdiff32
{
   internal class Program
   {
      private const string merge = "Merge.exe";

      private static void Main(string[] args)
      {
         if (args.Length >= 7 && args[0] == "-u")
         {
            args = new[] { args[5], args[6] };
         }
         var psi = new ProcessStartInfo { FileName = merge, Arguments = String.Join(" ", args) };
         Process.Start(psi);
      }
   }
}